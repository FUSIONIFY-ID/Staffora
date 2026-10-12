import { beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'

type Role = 'admin' | 'projectManager' | 'resourceManager' | 'employee'

const CREDENTIALS: Record<Role, { email: string; password: string }> = {
  admin: { email: 'admin@staffora.internal', password: 'StafforaAdmin2026!' },
  projectManager: { email: 'pm@staffora.internal', password: 'StafforaPM2026!' },
  resourceManager: { email: 'rm@staffora.internal', password: 'StafforaRM2026!' },
  employee: { email: 'employee@staffora.internal', password: 'StafforaEmp2026!' },
}

const MISSING_ID = '00000000-0000-4000-8000-000000000000'

interface Session {
  cookie: string
  csrfToken: string
  employeeId: string
}

const app = createApp({ useMemorySession: true })

const sessions: Record<string, Session | undefined> = {}

function unique(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`
}

async function login(role: Role): Promise<Session> {
  const existing = sessions[role]
  if (existing) {
    return existing
  }

  const res = await request(app).post('/api/v1/auth/login').send(CREDENTIALS[role])
  expect(res.status).toBe(200)

  const session: Session = {
    cookie: res.headers['set-cookie']?.[0] ?? '',
    csrfToken: res.body.data.csrfToken as string,
    employeeId: (res.body.data.user?.employeeId ?? res.body.data.employeeId) as string,
  }
  sessions[role] = session
  return session
}

async function firstDepartmentId(cookie: string): Promise<string> {
  const res = await request(app).get('/api/v1/departments').set('Cookie', cookie)
  return res.body.data[0].id as string
}

async function firstJobRoleId(cookie: string): Promise<string> {
  const res = await request(app).get('/api/v1/job-roles').set('Cookie', cookie)
  return res.body.data[0].id as string
}

function writeReq(
  session: Session,
  method: 'post' | 'patch' | 'put',
  path: string,
): request.Test {
  const req = request(app)[method](path)
  return req.set('Cookie', session.cookie).set('X-CSRF-Token', session.csrfToken)
}

async function createEmployee(
  session: Session,
  overrides: { employeeCode?: string; workEmail?: string } = {},
): Promise<{ id: string; employeeCode: string; workEmail: string }> {
  const res = await writeReq(session, 'post', '/api/v1/employees')
    .send({
      employeeCode: overrides.employeeCode ?? unique('TST'),
      fullName: 'Workforce Test Employee',
      workEmail: overrides.workEmail ?? `${unique('workforce')}@staffora.test`,
      departmentId: await firstDepartmentId(session.cookie),
      jobRoleId: await firstJobRoleId(session.cookie),
    })

  expect(res.status).toBe(201)
  return {
    id: res.body.data.id as string,
    employeeCode: res.body.data.employeeCode as string,
    workEmail: res.body.data.workEmail as string,
  }
}

describe('Workforce Employee Resource API (US02.01)', () => {
  beforeAll(async () => {
    for (const role of ['admin', 'projectManager', 'resourceManager', 'employee'] as Role[]) {
      await login(role)
    }
  })

  it('lists employees with the paginated envelope for an Admin', async () => {
    const { cookie } = await login('admin')
    const res = await request(app).get('/api/v1/employees').set('Cookie', cookie)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data.length).toBeGreaterThan(0)
    expect(res.body.meta).toMatchObject({ page: 1, pageSize: 20 })
    expect(res.body.meta.totalPages).toBeGreaterThanOrEqual(1)
    expect(res.body.data[0]).toMatchObject({
      departmentName: expect.any(String),
      jobRoleTitle: expect.any(String),
    })
  })

  it('paginates with explicit page and pageSize', async () => {
    const { cookie } = await login('admin')
    const res = await request(app).get('/api/v1/employees').query({ page: 2, pageSize: 2 }).set('Cookie', cookie)

    expect(res.status).toBe(200)
    expect(res.body.meta).toMatchObject({ page: 2, pageSize: 2 })
    expect(res.body.data.length).toBeLessThanOrEqual(2)
  })

  it('filters by search term over name and code, plus department, job role, and status', async () => {
    const { cookie } = await login('admin')
    const departmentId = await firstDepartmentId(cookie)
    const jobRoleId = await firstJobRoleId(cookie)

    const byName = await request(app).get('/api/v1/employees').query({ search: 'david' }).set('Cookie', cookie)
    expect(byName.status).toBe(200)
    expect(byName.body.data.map((e: { fullName: string }) => e.fullName)).toContain('David Kurnia')

    const byCode = await request(app).get('/api/v1/employees').query({ search: 'EMP-001' }).set('Cookie', cookie)
    expect(byCode.status).toBe(200)
    expect(byCode.body.data.map((e: { employeeCode: string }) => e.employeeCode)).toContain('EMP-001')

    const byDepartment = await request(app)
      .get('/api/v1/employees')
      .query({ departmentId })
      .set('Cookie', cookie)
    expect(byDepartment.status).toBe(200)
    expect(byDepartment.body.data.every((e: { departmentId: string }) => e.departmentId === departmentId)).toBe(true)

    const byRole = await request(app).get('/api/v1/employees').query({ jobRoleId }).set('Cookie', cookie)
    expect(byRole.status).toBe(200)
    expect(byRole.body.data.every((e: { jobRoleId: string }) => e.jobRoleId === jobRoleId)).toBe(true)

    const byStatus = await request(app).get('/api/v1/employees').query({ status: 'ACTIVE' }).set('Cookie', cookie)
    expect(byStatus.status).toBe(200)
    expect(byStatus.body.data.every((e: { status: string }) => e.status === 'ACTIVE')).toBe(true)
  })

  it('rejects invalid query values with a 422 field error', async () => {
    const { cookie } = await login('admin')
    const res = await request(app).get('/api/v1/employees').query({ status: 'SUSPENDED' }).set('Cookie', cookie)

    expect(res.status).toBe(422)
    expect(res.body.code).toBe('UNPROCESSABLE_ENTITY')
    expect(res.body.errors.status).toBeDefined()
  })

  it('creates an employee and rejects duplicate code and email with 409', async () => {
    const session = await login('admin')
    const departmentId = await firstDepartmentId(session.cookie)
    const jobRoleId = await firstJobRoleId(session.cookie)

    const employeeCode = unique('DUP')
    const workEmail = `${unique('dup.email')}@staffora.test`

    const created = await writeReq(session, 'post', '/api/v1/employees').send({
      employeeCode,
      fullName: 'Duplicate Test',
      workEmail,
      departmentId,
      jobRoleId,
    })
    expect(created.status).toBe(201)
    expect(created.body.data.status).toBe('ACTIVE')

    const sameCode = await writeReq(session, 'post', '/api/v1/employees').send({
      employeeCode,
      fullName: 'Duplicate Test',
      workEmail: `${unique('dup.code')}@staffora.test`,
      departmentId,
      jobRoleId,
    })
    expect(sameCode.status).toBe(409)
    expect(sameCode.body.code).toBe('DUPLICATE_EMPLOYEE_CODE')

    const sameEmail = await writeReq(session, 'post', '/api/v1/employees').send({
      employeeCode: unique('DUP'),
      fullName: 'Duplicate Test',
      workEmail,
      departmentId,
      jobRoleId,
    })
    expect(sameEmail.status).toBe(409)
    expect(sameEmail.body.code).toBe('DUPLICATE_WORK_EMAIL')
  })

  it('rejects creation referencing a department or job role that does not exist', async () => {
    const session = await login('admin')
    const departmentId = await firstDepartmentId(session.cookie)
    const jobRoleId = await firstJobRoleId(session.cookie)

    const badDepartment = await writeReq(session, 'post', '/api/v1/employees')
      .send({
        employeeCode: unique('MISSING-DEPT'),
        fullName: 'Missing Dept',
        workEmail: `${unique('missing.dept')}@staffora.test`,
        departmentId: MISSING_ID,
        jobRoleId,
      })
    expect(badDepartment.status).toBe(422)
    expect(badDepartment.body.errors.departmentId).toBeDefined()

    const badRole = await writeReq(session, 'post', '/api/v1/employees')
      .send({
        employeeCode: unique('MISSING-ROLE'),
        fullName: 'Missing Role',
        workEmail: `${unique('missing.role')}@staffora.test`,
        departmentId,
        jobRoleId: MISSING_ID,
      })
    expect(badRole.status).toBe(422)
    expect(badRole.body.errors.jobRoleId).toBeDefined()
  })

  it('updates an employee partially and deactivates without deleting', async () => {
    const session = await login('admin')
    const employee = await createEmployee(session)

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

    const stillThere = await request(app).get(`/api/v1/employees/${employee.id}`).set('Cookie', session.cookie)
    expect(stillThere.status).toBe(200)
    expect(stillThere.body.data.status).toBe('INACTIVE')
  })

  it('returns 404 for an employee that does not exist', async () => {
    const { cookie } = await login('admin')
    const res = await request(app).get(`/api/v1/employees/${MISSING_ID}`).set('Cookie', cookie)

    expect(res.status).toBe(404)
  })

  it('returns detail with skills, allocations, and a capacity summary', async () => {
    const { cookie } = await login('admin')
    const listed = await request(app).get('/api/v1/employees').query({ search: 'EMP-004' }).set('Cookie', cookie)
    expect(listed.body.data).toHaveLength(1)

    const res = await request(app).get(`/api/v1/employees/${listed.body.data[0].id}`).set('Cookie', cookie)

    expect(res.status).toBe(200)
    expect(res.body.data.skills).toBeInstanceOf(Array)
    expect(res.body.data.skills[0]).toMatchObject({
      skillName: 'React',
      skillIsActive: true,
      proficiencyLevel: 4,
    })
    expect(res.body.data.allocations).toBeInstanceOf(Array)
    expect(res.body.data.allocations[0]).toMatchObject({
      projectCode: 'PRJ-STAFFORA-01',
      allocationPercentage: 50,
      displayStatus: 'ACTIVE',
    })
    expect(res.body.data.capacitySummary).toMatchObject({
      activeAllocation: 50,
      peakConcurrentAllocation: 50,
      remainingCapacity: 50,
      hasCapacityConflict: false,
    })
  })

  it('lets a Resource Manager create and blocks Project Manager writes', async () => {
    const rm = await login('resourceManager')
    const pm = await login('projectManager')

    const created = await createEmployee(rm)
    expect(created.id).toBeTruthy()

    const pmRead = await request(app).get('/api/v1/employees').set('Cookie', pm.cookie)
    expect(pmRead.status).toBe(200)

    const pmWrite = await writeReq(pm, 'post', '/api/v1/employees')
      .send({
        employeeCode: unique('PM-DENIED'),
        fullName: 'PM Denied',
        workEmail: `${unique('pm.denied')}@staffora.test`,
        departmentId: await firstDepartmentId(pm.cookie),
        jobRoleId: await firstJobRoleId(pm.cookie),
      })
    expect(pmWrite.status).toBe(403)

    const pmPatch = await writeReq(pm, 'patch', `/api/v1/employees/${created.id}`).send({
      fullName: 'Should Not Apply',
    })
    expect(pmPatch.status).toBe(403)
  })

  it('lets an employee read only their own record', async () => {
    const employee = await login('employee')

    const own = await request(app).get(`/api/v1/employees/${employee.employeeId}`).set('Cookie', employee.cookie)
    expect(own.status).toBe(200)
    expect(own.body.data.id).toBe(employee.employeeId)

    const employeeList = await request(app).get('/api/v1/employees').set('Cookie', employee.cookie)
    expect(employeeList.status).toBe(403)

    const other = await createEmployee(await login('admin'))

    const forbidden = await request(app)
      .get(`/api/v1/employees/${other.id}`)
      .set('Cookie', employee.cookie)
    expect(forbidden.status).toBe(403)
  })

  it('rejects unauthenticated access to the employee endpoints', async () => {
    const list = await request(app).get('/api/v1/employees')
    expect(list.status).toBe(401)

    const create = await request(app).post('/api/v1/employees').send({})
    expect(create.status).toBe(403)
  })
})
