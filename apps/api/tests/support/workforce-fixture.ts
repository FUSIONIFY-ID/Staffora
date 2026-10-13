import request from 'supertest'
import { expect } from 'vitest'
import { createApp } from '../../src/app.js'
import { prisma } from '../../src/common/database/prisma.js'

export type Role = 'admin' | 'projectManager' | 'resourceManager' | 'employee'

export const CREDENTIALS: Record<Role, { email: string; password: string }> = {
  admin: { email: 'admin@staffora.internal', password: 'StafforaAdmin2026!' },
  projectManager: { email: 'pm@staffora.internal', password: 'StafforaPM2026!' },
  resourceManager: { email: 'rm@staffora.internal', password: 'StafforaRM2026!' },
  employee: { email: 'employee@staffora.internal', password: 'StafforaEmp2026!' },
}

export const MISSING_ID = '00000000-0000-4000-8000-000000000000'

export interface Session {
  cookie: string
  csrfToken: string
  employeeId: string
}

export const app = createApp({ useMemorySession: true })

const sessions: Record<string, Session | undefined> = {}

export function unique(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`
}

/** ISO date (YYYY-MM-DD) offset from today in UTC. */
export function isoDate(offsetDays: number): string {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}

export async function login(role: Role): Promise<Session> {
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

export function writeReq(session: Session, method: 'post' | 'patch', path: string): request.Test {
  return request(app)[method](path).set('Cookie', session.cookie).set('X-CSRF-Token', session.csrfToken)
}

/**
 * Rows owned by the workforce suite.
 *
 * Nothing here reads seeded rows such as EMP-004. The earlier version asserted
 * against seed data, so a database that had been seeded more than once produced
 * activeAllocation 150 instead of 50 and the suite failed on a developer
 * machine while passing in CI. Everything below is created in
 * setupWorkforceFixture and removed in teardownWorkforceFixture.
 */
export const fixture = {
  departmentId: '',
  departmentName: '',
  jobRoleId: '',
  jobRoleName: '',
  /** Has 50% allocation effective today. */
  employeeId: '',
  /** Has 100% allocation that only starts in 30 days. */
  futureOnlyEmployeeId: '',
  skillId: '',
  projectId: '',
  createdEmployeeIds: [] as string[],
}

export async function createEmployeeViaApi(
  session: Session,
  overrides: { employeeCode?: string; workEmail?: string } = {},
): Promise<{ id: string; employeeCode: string; workEmail: string }> {
  const res = await writeReq(session, 'post', '/api/v1/employees').send({
    employeeCode: overrides.employeeCode ?? unique('TST'),
    fullName: 'Workforce Test Employee',
    workEmail: overrides.workEmail ?? `${unique('workforce')}@staffora.test`,
    departmentId: fixture.departmentId,
    jobRoleId: fixture.jobRoleId,
    status: 'ACTIVE',
  })

  expect(res.status).toBe(201)
  const id = res.body.data.id as string
  fixture.createdEmployeeIds.push(id)

  return {
    id,
    employeeCode: res.body.data.employeeCode as string,
    workEmail: res.body.data.workEmail as string,
  }
}

export async function setupWorkforceFixture(): Promise<void> {
  for (const role of ['admin', 'projectManager', 'resourceManager', 'employee'] as Role[]) {
    await login(role)
  }

  const admin = await login('admin')

  fixture.departmentName = unique('WF Dept')
  const department = await writeReq(admin, 'post', '/api/v1/departments').send({ name: fixture.departmentName })
  expect(department.status).toBe(201)
  fixture.departmentId = department.body.data.id as string

  fixture.jobRoleName = unique('WF Role')
  const jobRole = await writeReq(admin, 'post', '/api/v1/job-roles').send({ name: fixture.jobRoleName })
  expect(jobRole.status).toBe(201)
  fixture.jobRoleId = jobRole.body.data.id as string

  fixture.employeeId = (await createEmployeeViaApi(admin, { employeeCode: unique('WF-EMP') })).id
  fixture.futureOnlyEmployeeId = (await createEmployeeViaApi(admin, { employeeCode: unique('WF-FUTURE') })).id

  const skill = await prisma.skill.create({ data: { name: unique('WF Skill') }, select: { id: true } })
  fixture.skillId = skill.id

  await prisma.employeeSkill.create({
    data: { employeeId: fixture.employeeId, skillId: fixture.skillId, proficiencyLevel: 4 },
  })

  const project = await prisma.project.create({
    data: {
      projectCode: unique('WF-PRJ'),
      name: 'Workforce Fixture Project',
      projectManagerEmployeeId: fixture.employeeId,
      startDate: new Date(`${isoDate(-30)}T00:00:00.000Z`),
      endDate: new Date(`${isoDate(180)}T00:00:00.000Z`),
    },
    select: { id: true },
  })
  fixture.projectId = project.id

  await prisma.allocation.create({
    data: {
      employeeId: fixture.employeeId,
      projectId: fixture.projectId,
      jobRoleId: fixture.jobRoleId,
      allocationPercentage: 50,
      startDate: new Date(`${isoDate(-10)}T00:00:00.000Z`),
      endDate: new Date(`${isoDate(60)}T00:00:00.000Z`),
    },
  })

  // Starts in the future only: must not move the current availability indicator.
  await prisma.allocation.create({
    data: {
      employeeId: fixture.futureOnlyEmployeeId,
      projectId: fixture.projectId,
      jobRoleId: fixture.jobRoleId,
      allocationPercentage: 100,
      startDate: new Date(`${isoDate(30)}T00:00:00.000Z`),
      endDate: new Date(`${isoDate(90)}T00:00:00.000Z`),
    },
  })
}

export async function teardownWorkforceFixture(): Promise<void> {
  const employeeIds = [fixture.employeeId, fixture.futureOnlyEmployeeId, ...fixture.createdEmployeeIds]

  await prisma.allocation.deleteMany({ where: { employeeId: { in: employeeIds } } })
  await prisma.project.deleteMany({ where: { id: fixture.projectId } })
  await prisma.employeeSkill.deleteMany({ where: { employeeId: { in: employeeIds } } })
  await prisma.employee.deleteMany({ where: { id: { in: employeeIds } } })
  await prisma.skill.deleteMany({ where: { id: fixture.skillId } })
  await prisma.jobRole.deleteMany({ where: { id: fixture.jobRoleId } })
  await prisma.department.deleteMany({ where: { id: fixture.departmentId } })
}
