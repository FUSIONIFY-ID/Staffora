import { randomBytes } from 'node:crypto'
import request from 'supertest'
import { expect } from 'vitest'
import { createApp } from '../../src/app.js'
import { prisma } from '../../src/common/database/prisma.js'
import { hashPassword } from '../../src/common/auth/password.js'
import { identityRepository } from '../../src/modules/identity/identity.repository.js'

export type Role = 'admin' | 'projectManager' | 'resourceManager' | 'employee'

export const MISSING_ID = '00000000-0000-4000-8000-000000000000'

export interface Session {
  cookie: string
  csrfToken: string
  employeeId: string
}

export const app = createApp({ useMemorySession: true })

const sessions: Partial<Record<Role, Session>> = {}

/**
 * Accounts are created by this fixture on every run, with a password generated
 * per run and hashed with the same helper the API uses. Nothing here reads a
 * seeded account or contains a password literal, so the suite neither depends
 * on `db:seed` nor commits a credential.
 */
interface Account {
  id: string
  email: string
  password: string
  employeeId: string
}

const accounts: Partial<Record<Role, Account>> = {}

/** Ids of every row this fixture created, so teardown can remove exactly those. */
const created = {
  userIds: [] as string[],
  employeeIds: [] as string[],
  departmentIds: [] as string[],
  jobRoleIds: [] as string[],
  skillIds: [] as string[],
  projectIds: [] as string[],
}

export function unique(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`
}

/** ISO date (YYYY-MM-DD) offset from today in UTC. */
export function isoDate(offsetDays: number): string {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}

function generatePassword(): string {
  return `${randomBytes(18).toString('base64url')}Aa1!`
}

async function createAccount(role: Role, employeeId?: string): Promise<Account> {
  const email = `${unique(`wf.${role}`)}@staffora.test`
  const password = generatePassword()

  // Created through the identity repository so the stored email is normalised
  // exactly as a real signup normalises it; writing the row directly would skip
  // the lowercasing and the account would then fail its own login.
  const user = await identityRepository.createUser({
    normalizedEmail: email,
    passwordHash: await hashPassword(password),
    role: ROLE_NAMES[role],
    ...(employeeId === undefined ? {} : { employeeId }),
  })
  created.userIds.push(user.id)

  const account: Account = { id: user.id, email, password, employeeId: employeeId ?? '' }
  accounts[role] = account
  return account
}

const ROLE_NAMES: Record<Role, 'ADMIN' | 'PROJECT_MANAGER' | 'RESOURCE_MANAGER' | 'EMPLOYEE'> = {
  admin: 'ADMIN',
  projectManager: 'PROJECT_MANAGER',
  resourceManager: 'RESOURCE_MANAGER',
  employee: 'EMPLOYEE',
}

async function createEmployeeRow(
  departmentId: string,
  jobRoleId: string,
  codePrefix: string,
): Promise<string> {
  const employee = await prisma.employee.create({
    data: {
      employeeCode: unique(codePrefix),
      fullName: 'Workforce Fixture Employee',
      workEmail: `${unique('wf.employee')}@staffora.test`,
      departmentId,
      jobRoleId,
    },
    select: { id: true },
  })
  created.employeeIds.push(employee.id)
  return employee.id
}

export async function login(role: Role): Promise<Session> {
  const existing = sessions[role]
  if (existing) {
    return existing
  }

  const account = accounts[role]
  if (!account) {
    throw new Error(`The ${role} account was not created; call setupWorkforceFixture first.`)
  }

  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: account.email, password: account.password })
  expect(res.status).toBe(200)

  const session: Session = {
    cookie: res.headers['set-cookie']?.[0] ?? '',
    csrfToken: res.body.data.csrfToken as string,
    employeeId: account.employeeId,
  }
  sessions[role] = session
  return session
}

export function writeReq(session: Session, method: 'post' | 'patch', path: string): request.Test {
  const agent = request(app)
  const call = method === 'post' ? agent.post(path) : agent.patch(path)
  return call.set('Cookie', session.cookie).set('X-CSRF-Token', session.csrfToken)
}

/**
 * Rows owned by the workforce suite.
 *
 * Nothing here reads seeded rows such as EMP-004. The earlier version asserted
 * against seed data, so a database that had been seeded more than once produced
 * currentAllocation 150 instead of 50 and the suite failed on a developer
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
  // Master data and the employee-backed account come first, because an Employee
  // row needs a department and a job role and the EMPLOYEE session needs a
  // linked employee. Creating them directly keeps setup independent of the
  // seeded accounts; the API paths are covered by the suite itself.
  const department = await prisma.department.create({
    data: { name: unique('WF Dept') },
    select: { id: true, name: true },
  })
  created.departmentIds.push(department.id)
  fixture.departmentId = department.id
  fixture.departmentName = department.name

  const jobRole = await prisma.jobRole.create({
    data: { name: unique('WF Role') },
    select: { id: true, name: true },
  })
  created.jobRoleIds.push(jobRole.id)
  fixture.jobRoleId = jobRole.id
  fixture.jobRoleName = jobRole.name

  await createAccount('admin')
  await createAccount('projectManager')
  await createAccount('resourceManager')

  const employeeAccountEmployeeId = await createEmployeeRow(
    fixture.departmentId,
    fixture.jobRoleId,
    'WF-ACCT',
  )
  await createAccount('employee', employeeAccountEmployeeId)

  const admin = await login('admin')

  fixture.employeeId = (await createEmployeeViaApi(admin, { employeeCode: unique('WF-EMP') })).id
  fixture.futureOnlyEmployeeId = (
    await createEmployeeViaApi(admin, { employeeCode: unique('WF-FUTURE') })
  ).id

  const skill = await prisma.skill.create({ data: { name: unique('WF Skill') }, select: { id: true } })
  created.skillIds.push(skill.id)
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
  created.projectIds.push(project.id)
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

/**
 * Removes every row this fixture created.
 *
 * Each step is attempted even when an earlier one fails, so a single broken
 * cleanup cannot leave the rest of the fixture behind; the failures are
 * collected and reported once every step has run. Steps are ordered so a
 * foreign key is never left pointing at a deleted row.
 */
export async function teardownWorkforceFixture(): Promise<void> {
  const employeeIds = [
    fixture.employeeId,
    fixture.futureOnlyEmployeeId,
    ...fixture.createdEmployeeIds,
    ...created.employeeIds,
  ].filter((id) => id !== '')

  const userIds = created.userIds.filter((id) => id !== '')

  const steps: Array<[string, () => Promise<unknown>]> = [
    [
      'allocations',
      () =>
        prisma.allocation.deleteMany({
          where: {
            OR: [
              ...(employeeIds.length > 0 ? [{ employeeId: { in: employeeIds } }] : []),
              ...(created.projectIds.length > 0 ? [{ projectId: { in: created.projectIds } }] : []),
            ],
          },
        }),
    ],
    ['projects', () => prisma.project.deleteMany({ where: { id: { in: created.projectIds } } })],
    [
      'employee skills',
      () => prisma.employeeSkill.deleteMany({ where: { employeeId: { in: employeeIds } } }),
    ],
    ['users', () => prisma.user.deleteMany({ where: { id: { in: userIds } } })],
    ['employees', () => prisma.employee.deleteMany({ where: { id: { in: employeeIds } } })],
    ['skills', () => prisma.skill.deleteMany({ where: { id: { in: created.skillIds } } })],
    ['job roles', () => prisma.jobRole.deleteMany({ where: { id: { in: created.jobRoleIds } } })],
    [
      'departments',
      () => prisma.department.deleteMany({ where: { id: { in: created.departmentIds } } }),
    ],
  ]

  const failures: string[] = []

  for (const [label, step] of steps) {
    try {
      await step()
    } catch (error) {
      failures.push(`${label}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  if (failures.length > 0) {
    throw new Error(`Workforce fixture teardown failed for ${failures.join('; ')}`)
  }
}
