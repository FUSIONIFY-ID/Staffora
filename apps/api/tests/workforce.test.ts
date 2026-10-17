import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { prisma } from '../src/common/database/prisma.js'
import {
  MISSING_ID,
  app,
  createEmployeeViaApi,
  fixture,
  isoDate,
  login,
  setupWorkforceFixture,
  teardownWorkforceFixture,
  unique,
  writeReq,
} from './support/workforce-fixture.js'

describe('Workforce Employee Resource API (US02.01)', () => {
  beforeAll(setupWorkforceFixture)
  afterAll(teardownWorkforceFixture)

  describe('list, filter, and pagination', () => {
    it('lists employees with the paginated envelope for an Admin', async () => {
      const { cookie } = await login('admin')
      const res = await request(app).get('/api/v1/employees').set('Cookie', cookie)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.meta).toMatchObject({ page: 1, pageSize: 20 })
      expect(res.body.meta.totalPages).toBeGreaterThanOrEqual(1)
      expect(res.body.data[0]).toMatchObject({
        departmentName: expect.any(String),
        jobRoleTitle: expect.any(String),
        availability: expect.any(String),
        currentAllocation: expect.any(Number),
        currentRemainingCapacity: expect.any(Number),
      })
    })

    it('paginates with explicit page and pageSize', async () => {
      const { cookie } = await login('admin')
      const res = await request(app)
        .get('/api/v1/employees')
        .query({ page: 2, pageSize: 2 })
        .set('Cookie', cookie)

      expect(res.status).toBe(200)
      expect(res.body.meta).toMatchObject({ page: 2, pageSize: 2 })
      expect(res.body.data.length).toBeLessThanOrEqual(2)
    })

    it('filters by search term over name and code, plus department, job role, and status', async () => {
      const session = await login('admin')
      const searchable = await createEmployeeViaApi(session)

      const renamed = await writeReq(session, 'patch', `/api/v1/employees/${searchable.id}`).send({
        fullName: 'Filterable Person',
      })
      expect(renamed.status).toBe(200)

      const byName = await request(app)
        .get('/api/v1/employees')
        .query({ search: 'Filterable' })
        .set('Cookie', session.cookie)
      expect(byName.status).toBe(200)
      expect(byName.body.data.map((e: { id: string }) => e.id)).toContain(searchable.id)

      const byCode = await request(app)
        .get('/api/v1/employees')
        .query({ search: searchable.employeeCode })
        .set('Cookie', session.cookie)
      expect(byCode.status).toBe(200)
      expect(byCode.body.data.map((e: { employeeCode: string }) => e.employeeCode)).toContain(
        searchable.employeeCode,
      )

      const byDepartment = await request(app)
        .get('/api/v1/employees')
        .query({ departmentId: fixture.departmentId, pageSize: 100 })
        .set('Cookie', session.cookie)
      expect(byDepartment.status).toBe(200)
      // Non-empty first: `every()` on an empty array passes, so the filter could
      // silently return nothing and the assertion would still be green.
      expect(byDepartment.body.data.length).toBeGreaterThan(0)
      expect(
        byDepartment.body.data.every(
          (e: { departmentId: string }) => e.departmentId === fixture.departmentId,
        ),
      ).toBe(true)

      const byRole = await request(app)
        .get('/api/v1/employees')
        .query({ jobRoleId: fixture.jobRoleId, pageSize: 100 })
        .set('Cookie', session.cookie)
      expect(byRole.status).toBe(200)
      expect(byRole.body.data.length).toBeGreaterThan(0)
      expect(byRole.body.data.every((e: { jobRoleId: string }) => e.jobRoleId === fixture.jobRoleId)).toBe(true)

      const byStatus = await request(app)
        .get('/api/v1/employees')
        .query({ status: 'ACTIVE', pageSize: 100 })
        .set('Cookie', session.cookie)
      expect(byStatus.status).toBe(200)
      expect(byStatus.body.data.length).toBeGreaterThan(0)
      expect(byStatus.body.data.every((e: { status: string }) => e.status === 'ACTIVE')).toBe(true)

      // The paginated list is ordered by full name, so a filtered page is a
      // subset of the whole list rather than of the first 100 rows by chance.
      const excluded = await request(app)
        .get('/api/v1/employees')
        .query({ departmentId: MISSING_ID })
        .set('Cookie', session.cookie)
      expect(excluded.status).toBe(200)
      expect(excluded.body.data).toHaveLength(0)
      expect(excluded.body.meta.total).toBe(0)
    })

    it('rejects invalid query values with a 422 field error', async () => {
      const { cookie } = await login('admin')
      const res = await request(app)
        .get('/api/v1/employees')
        .query({ status: 'SUSPENDED' })
        .set('Cookie', cookie)

      expect(res.status).toBe(422)
      expect(res.body.code).toBe('UNPROCESSABLE_ENTITY')
      expect(res.body.errors.status).toBeDefined()
    })
  })

  describe('current availability (AC01.03)', () => {
    it('reports availability from allocation effective today, not from future allocations', async () => {
      const { cookie } = await login('admin')

      const list = await request(app).get('/api/v1/employees').query({ pageSize: 100 }).set('Cookie', cookie)
      expect(list.status).toBe(200)

      const rows = list.body.data as Array<{
        id: string
        currentAllocation: number
        currentRemainingCapacity: number
        availability: string
      }>

      expect(rows.find((row) => row.id === fixture.employeeId)).toMatchObject({
        currentAllocation: 50,
        currentRemainingCapacity: 50,
        availability: 'PARTIAL',
      })

      // Regression: free today, fully allocated in a month, must not read as
      // FULLY_ALLOCATED.
      expect(rows.find((row) => row.id === fixture.futureOnlyEmployeeId)).toMatchObject({
        currentAllocation: 0,
        currentRemainingCapacity: 100,
        availability: 'AVAILABLE',
      })
    })

    it('marks an inactive employee as NOT_ASSIGNABLE', async () => {
      const session = await login('admin')
      const employee = await createEmployeeViaApi(session)

      const deactivated = await writeReq(session, 'patch', `/api/v1/employees/${employee.id}`).send({
        status: 'INACTIVE',
      })
      expect(deactivated.status).toBe(200)
      expect(deactivated.body.data.availability).toBe('NOT_ASSIGNABLE')
    })

    it('counts an allocation that starts today or ends today, and excludes one that ended yesterday', async () => {
      const session = await login('admin')

      const cases: Array<{ label: string; start: string; end: string; expected: number }> = [
        { label: 'starts today', start: isoDate(0), end: isoDate(30), expected: 40 },
        { label: 'ends today', start: isoDate(-30), end: isoDate(0), expected: 40 },
        { label: 'ended yesterday', start: isoDate(-30), end: isoDate(-1), expected: 0 },
        { label: 'starts tomorrow', start: isoDate(1), end: isoDate(30), expected: 0 },
      ]

      for (const testCase of cases) {
        const employee = await createEmployeeViaApi(session)
        await prisma.allocation.create({
          data: {
            employeeId: employee.id,
            projectId: fixture.projectId,
            jobRoleId: fixture.jobRoleId,
            allocationPercentage: 40,
            startDate: new Date(`${testCase.start}T00:00:00.000Z`),
            endDate: new Date(`${testCase.end}T00:00:00.000Z`),
          },
        })

        const res = await request(app)
          .get(`/api/v1/employees/${employee.id}`)
          .set('Cookie', session.cookie)

        expect(res.status).toBe(200)
        expect(res.body.data, testCase.label).toMatchObject({
          currentAllocation: testCase.expected,
          currentRemainingCapacity: 100 - testCase.expected,
        })
      }
    })
  })

  describe('create, update, and lifecycle', () => {
    it('creates an employee and rejects duplicate code and email with 409', async () => {
      const session = await login('admin')

      const employeeCode = unique('DUP')
      const workEmail = `${unique('dup.email')}@staffora.test`

      const created = await writeReq(session, 'post', '/api/v1/employees').send({
        employeeCode,
        fullName: 'Duplicate Test',
        workEmail,
        departmentId: fixture.departmentId,
        jobRoleId: fixture.jobRoleId,
        status: 'ACTIVE',
      })
      expect(created.status).toBe(201)
      expect(created.body.data.status).toBe('ACTIVE')
      fixture.createdEmployeeIds.push(created.body.data.id as string)

      const sameCode = await writeReq(session, 'post', '/api/v1/employees').send({
        employeeCode,
        fullName: 'Duplicate Test',
        workEmail: `${unique('dup.code')}@staffora.test`,
        departmentId: fixture.departmentId,
        jobRoleId: fixture.jobRoleId,
        status: 'ACTIVE',
      })
      expect(sameCode.status).toBe(409)
      expect(sameCode.body.code).toBe('DUPLICATE_EMPLOYEE_CODE')

      const sameEmail = await writeReq(session, 'post', '/api/v1/employees').send({
        employeeCode: unique('DUP'),
        fullName: 'Duplicate Test',
        workEmail,
        departmentId: fixture.departmentId,
        jobRoleId: fixture.jobRoleId,
        status: 'ACTIVE',
      })
      expect(sameEmail.status).toBe(409)
      expect(sameEmail.body.code).toBe('DUPLICATE_WORK_EMAIL')
    })

    it('rejects a concurrent duplicate with 409 rather than 500', async () => {
      const session = await login('admin')
      const employeeCode = unique('RACE')
      const body = {
        employeeCode,
        fullName: 'Concurrent Duplicate',
        workEmail: `${unique('race')}@staffora.test`,
        departmentId: fixture.departmentId,
        jobRoleId: fixture.jobRoleId,
        status: 'ACTIVE' as const,
      }

      const [first, second] = await Promise.all([
        writeReq(session, 'post', '/api/v1/employees').send(body),
        writeReq(session, 'post', '/api/v1/employees').send({
          ...body,
          workEmail: `${unique('race.other')}@staffora.test`,
        }),
      ])

      expect([first.status, second.status].sort((a, b) => a - b)).toEqual([201, 409])

      // The losing request must still name the field that collided; it used to
      // fall back to a generic DUPLICATE_RESOURCE because the driver adapter
      // leaves meta.target empty.
      const loser = first.status === 409 ? first : second
      expect(loser.body.code).toBe('DUPLICATE_EMPLOYEE_CODE')

      fixture.createdEmployeeIds.push((first.status === 201 ? first : second).body.data.id as string)
    })

    it('rejects a duplicate department name with 409, case-insensitively', async () => {
      const session = await login('admin')

      const duplicate = await writeReq(session, 'post', '/api/v1/departments').send({
        name: fixture.departmentName,
      })
      expect(duplicate.status).toBe(409)
      expect(duplicate.body.code).toBe('DUPLICATE_DEPARTMENT_NAME')

      const differentCase = await writeReq(session, 'post', '/api/v1/departments').send({
        name: `  ${fixture.departmentName.toUpperCase()}  `,
      })
      expect(differentCase.status).toBe(409)
      expect(differentCase.body.code).toBe('DUPLICATE_DEPARTMENT_NAME')
    })

    it('rejects concurrent case-variant department names at the database level', async () => {
      const session = await login('admin')
      const name = unique('WF Race Dept')

      try {
        // The pre-flight lookup cannot see a row that is still being inserted, so
        // these two requests can both pass it. The unique index on lower(name) is
        // what has to stop the second one (ERD 2.3).
        const results = await Promise.all([
          writeReq(session, 'post', '/api/v1/departments').send({ name }),
          writeReq(session, 'post', '/api/v1/departments').send({ name: name.toUpperCase() }),
        ])

        const statuses = results.map((res) => res.status).sort((a, b) => a - b)
        expect(statuses).toEqual([201, 409])

        const loser = results.find((res) => res.status === 409)
        expect(loser?.body.code).toBe('DUPLICATE_DEPARTMENT_NAME')

        const stored = await prisma.department.findMany({
          where: { name: { equals: name, mode: 'insensitive' } },
          select: { id: true },
        })
        expect(stored).toHaveLength(1)
      } finally {
        // In a finally block so a failed assertion cannot leave a row behind.
        // A leftover duplicate makes the unique index impossible to recreate,
        // which is exactly what happened during the round 3 review: the mutation
        // check failed before reaching the old cleanup and the rows had to be
        // removed by hand. `name` is unique per run, so this cannot touch rows
        // the suite did not create.
        await prisma.department.deleteMany({
          where: { name: { equals: name, mode: 'insensitive' } },
        })
      }
    })

    it('rejects concurrent case-variant job role names at the database level', async () => {
      const session = await login('admin')
      const name = unique('WF Race Role')

      try {
        const results = await Promise.all([
          writeReq(session, 'post', '/api/v1/job-roles').send({ name }),
          writeReq(session, 'post', '/api/v1/job-roles').send({ name: name.toUpperCase() }),
        ])

        const statuses = results.map((res) => res.status).sort((a, b) => a - b)
        expect(statuses).toEqual([201, 409])

        const loser = results.find((res) => res.status === 409)
        expect(loser?.body.code).toBe('DUPLICATE_JOB_ROLE_NAME')

        const stored = await prisma.jobRole.findMany({
          where: { name: { equals: name, mode: 'insensitive' } },
          select: { id: true },
        })
        expect(stored).toHaveLength(1)
      } finally {
        // See the department counterpart: cleanup runs even when an assertion
        // fails, so a leftover duplicate cannot block the unique index.
        await prisma.jobRole.deleteMany({
          where: { name: { equals: name, mode: 'insensitive' } },
        })
      }
    })

    it('rejects creation referencing a department or job role that does not exist', async () => {
      const session = await login('admin')

      const badDepartment = await writeReq(session, 'post', '/api/v1/employees').send({
        employeeCode: unique('MISSING-DEPT'),
        fullName: 'Missing Dept',
        workEmail: `${unique('missing.dept')}@staffora.test`,
        departmentId: MISSING_ID,
        jobRoleId: fixture.jobRoleId,
        status: 'ACTIVE',
      })
      expect(badDepartment.status).toBe(422)
      expect(badDepartment.body.errors.departmentId).toBeDefined()

      const badRole = await writeReq(session, 'post', '/api/v1/employees').send({
        employeeCode: unique('MISSING-ROLE'),
        fullName: 'Missing Role',
        workEmail: `${unique('missing.role')}@staffora.test`,
        departmentId: fixture.departmentId,
        jobRoleId: MISSING_ID,
        status: 'ACTIVE',
      })
      expect(badRole.status).toBe(422)
      expect(badRole.body.errors.jobRoleId).toBeDefined()
    })

    it('requires status on create, per the approved contract', async () => {
      const session = await login('admin')
      const res = await writeReq(session, 'post', '/api/v1/employees').send({
        employeeCode: unique('NO-STATUS'),
        fullName: 'No Status',
        workEmail: `${unique('no.status')}@staffora.test`,
        departmentId: fixture.departmentId,
        jobRoleId: fixture.jobRoleId,
      })

      expect(res.status).toBe(422)
      expect(res.body.errors.status).toBeDefined()
    })

    it('updates an employee partially and deactivates without deleting', async () => {
      const session = await login('admin')
      const employee = await createEmployeeViaApi(session)

      const updated = await writeReq(session, 'patch', `/api/v1/employees/${employee.id}`).send({
        fullName: 'Renamed Workforce Employee',
      })
      expect(updated.status).toBe(200)
      expect(updated.body.data.fullName).toBe('Renamed Workforce Employee')

      const deactivated = await writeReq(session, 'patch', `/api/v1/employees/${employee.id}`).send({
        status: 'INACTIVE',
      })
      expect(deactivated.status).toBe(200)
      expect(deactivated.body.data.status).toBe('INACTIVE')

      const stillThere = await request(app)
        .get(`/api/v1/employees/${employee.id}`)
        .set('Cookie', session.cookie)
      expect(stillThere.status).toBe(200)
      expect(stillThere.body.data.status).toBe('INACTIVE')
    })
  })

  describe('detail and capacity window (AC04.04)', () => {
    it('returns 404 for an employee that does not exist', async () => {
      const { cookie } = await login('admin')
      const res = await request(app).get(`/api/v1/employees/${MISSING_ID}`).set('Cookie', cookie)

      expect(res.status).toBe(404)
    })

    it('returns 422 rather than 500 for a malformed employee id', async () => {
      const session = await login('admin')

      const detail = await request(app).get('/api/v1/employees/not-a-uuid').set('Cookie', session.cookie)
      expect(detail.status).toBe(422)
      expect(detail.body.code).toBe('UNPROCESSABLE_ENTITY')
      expect(detail.body.errors.id).toBeDefined()

      const update = await writeReq(session, 'patch', '/api/v1/employees/not-a-uuid').send({
        fullName: 'Nope',
      })
      expect(update.status).toBe(422)
      expect(update.body.errors.id).toBeDefined()
    })

    it('returns detail with skills, allocations, and a capacity summary', async () => {
      const { cookie } = await login('admin')
      const res = await request(app).get(`/api/v1/employees/${fixture.employeeId}`).set('Cookie', cookie)

      expect(res.status).toBe(200)
      expect(res.body.data.skills).toHaveLength(1)
      expect(res.body.data.skills[0]).toMatchObject({ skillIsActive: true, proficiencyLevel: 4 })
      expect(res.body.data.allocations).toHaveLength(1)
      expect(res.body.data.allocations[0]).toMatchObject({
        employeeId: fixture.employeeId,
        allocationPercentage: 50,
        displayStatus: 'ACTIVE',
      })
      expect(res.body.data.currentAllocation).toBe(50)
      expect(res.body.data.currentRemainingCapacity).toBe(50)
      // The window figures are reported once, in evaluatedPeriod. There is no
      // second summed figure, because sequential allocations must not be added
      // together as simultaneous workload (TSD 10.3 / BR-G17).
      expect(res.body.data.evaluatedPeriod).toMatchObject({
        peakConcurrentAllocation: 50,
        remainingCapacity: 50,
      })
      expect(res.body.data.capacitySummary).toBeUndefined()
    })

    it('evaluates the capacity summary over a requested date range', async () => {
      const { cookie } = await login('admin')

      const futureWindow = await request(app)
        .get(`/api/v1/employees/${fixture.futureOnlyEmployeeId}`)
        .query({ startDate: isoDate(31), endDate: isoDate(60) })
        .set('Cookie', cookie)

      expect(futureWindow.status).toBe(200)
      expect(futureWindow.body.data.evaluatedPeriod).toMatchObject({
        startDate: isoDate(31),
        endDate: isoDate(60),
        peakConcurrentAllocation: 100,
        remainingCapacity: 0,
      })

      const today = await request(app)
        .get(`/api/v1/employees/${fixture.futureOnlyEmployeeId}`)
        .query({ startDate: isoDate(0), endDate: isoDate(0) })
        .set('Cookie', cookie)

      expect(today.status).toBe(200)
      expect(today.body.data.evaluatedPeriod).toMatchObject({
        peakConcurrentAllocation: 0,
        remainingCapacity: 100,
      })
    })

    it('does not sum sequential allocations inside one window as concurrent load', async () => {
      const session = await login('admin')
      const employee = await createEmployeeViaApi(session)

      // 60% in month one and 60% in month two do not overlap, so the peak is 60
      // and never 120 (TSD 10.3 / BR-G17).
      for (const [start, end] of [
        [isoDate(60), isoDate(89)],
        [isoDate(90), isoDate(119)],
      ] as Array<[string, string]>) {
        await prisma.allocation.create({
          data: {
            employeeId: employee.id,
            projectId: fixture.projectId,
            jobRoleId: fixture.jobRoleId,
            allocationPercentage: 60,
            startDate: new Date(`${start}T00:00:00.000Z`),
            endDate: new Date(`${end}T00:00:00.000Z`),
          },
        })
      }

      const res = await request(app)
        .get(`/api/v1/employees/${employee.id}`)
        .query({ startDate: isoDate(60), endDate: isoDate(119) })
        .set('Cookie', session.cookie)

      expect(res.status).toBe(200)
      expect(res.body.data.evaluatedPeriod).toMatchObject({
        peakConcurrentAllocation: 60,
        remainingCapacity: 40,
      })
    })

    it('rejects an inverted or malformed date range with 422', async () => {
      const { cookie } = await login('admin')

      const inverted = await request(app)
        .get(`/api/v1/employees/${fixture.employeeId}`)
        .query({ startDate: isoDate(10), endDate: isoDate(1) })
        .set('Cookie', cookie)
      expect(inverted.status).toBe(422)

      const malformed = await request(app)
        .get(`/api/v1/employees/${fixture.employeeId}`)
        .query({ startDate: '13-10-2026' })
        .set('Cookie', cookie)
      expect(malformed.status).toBe(422)

      // Regression: endDate on its own used to be compared against nothing, so
      // a past endDate produced 200 with startDate (today) after endDate and
      // figures that contradicted the current-allocation fields.
      const pastEndDate = await request(app)
        .get(`/api/v1/employees/${fixture.employeeId}`)
        .query({ endDate: isoDate(-1) })
        .set('Cookie', cookie)
      expect(pastEndDate.status).toBe(422)
      expect(pastEndDate.body.code).toBe('UNPROCESSABLE_ENTITY')
      expect(pastEndDate.body.errors.endDate).toBeDefined()

      const sameDay = await request(app)
        .get(`/api/v1/employees/${fixture.employeeId}`)
        .query({ endDate: isoDate(0) })
        .set('Cookie', cookie)
      expect(sameDay.status).toBe(200)
      expect(sameDay.body.data.evaluatedPeriod).toMatchObject({
        startDate: isoDate(0),
        endDate: isoDate(0),
      })
    })
  })

  describe('authorization', () => {
    it('lets a Resource Manager create and blocks Project Manager writes', async () => {
      const rm = await login('resourceManager')
      const pm = await login('projectManager')

      const created = await createEmployeeViaApi(rm)
      expect(created.id).toBeTruthy()

      const pmRead = await request(app).get('/api/v1/employees').set('Cookie', pm.cookie)
      expect(pmRead.status).toBe(200)

      const pmWrite = await writeReq(pm, 'post', '/api/v1/employees').send({
        employeeCode: unique('PM-DENIED'),
        fullName: 'PM Denied',
        workEmail: `${unique('pm.denied')}@staffora.test`,
        departmentId: fixture.departmentId,
        jobRoleId: fixture.jobRoleId,
        status: 'ACTIVE',
      })
      expect(pmWrite.status).toBe(403)

      const pmPatch = await writeReq(pm, 'patch', `/api/v1/employees/${created.id}`).send({
        fullName: 'Should Not Apply',
      })
      expect(pmPatch.status).toBe(403)
    })

    it('lets an employee read only their own record, with 404 non-disclosure', async () => {
      const employee = await login('employee')

      const own = await request(app)
        .get(`/api/v1/employees/${employee.employeeId}`)
        .set('Cookie', employee.cookie)
      expect(own.status).toBe(200)
      expect(own.body.data.id).toBe(employee.employeeId)

      const employeeList = await request(app).get('/api/v1/employees').set('Cookie', employee.cookie)
      expect(employeeList.status).toBe(403)

      // A colleague's record answers 404, the same as an unknown id, so the
      // response cannot be used to enumerate employee ids. The body and code are
      // compared too, because an identical status alone would still leak a
      // difference through the message.
      const colleague = await request(app)
        .get(`/api/v1/employees/${fixture.employeeId}`)
        .set('Cookie', employee.cookie)
      expect(colleague.status).toBe(404)

      const unknown = await request(app)
        .get(`/api/v1/employees/${MISSING_ID}`)
        .set('Cookie', employee.cookie)
      expect(unknown.status).toBe(404)

      expect(colleague.body.code).toBe(unknown.body.code)
      expect(colleague.body.message).toBe(unknown.body.message)
      expect(colleague.body.errors).toEqual(unknown.body.errors)
    })

    it('rejects an unauthenticated request with 401', async () => {
      const list = await request(app).get('/api/v1/employees')
      expect(list.status).toBe(401)
      expect(list.body.code).toBe('UNAUTHORIZED')

      const detail = await request(app).get(`/api/v1/employees/${MISSING_ID}`)
      expect(detail.status).toBe(401)
      expect(detail.body.code).toBe('UNAUTHORIZED')
    })

    it('rejects a state-changing request without a CSRF token before it reaches authentication', async () => {
      // The CSRF middleware runs before the route's requireAuth, so a POST with
      // no session and no token answers 403, not 401. Kept separate from the
      // test above so the name matches what is actually being asserted.
      const create = await request(app).post('/api/v1/employees').send({})
      expect(create.status).toBe(403)
      expect(create.body.code).toBe('FORBIDDEN')
    })
  })
})
