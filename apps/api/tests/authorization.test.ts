import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import type { Request, Response } from 'express'
import { createApp } from '../src/app.js'
import { prisma } from '../src/common/database/prisma.js'
import { ROLES, ROLE_VALUES, type AuthenticatedUser } from '../src/common/auth/types.js'
import type { AppError } from '../src/common/errors/app-error.js'
import {
  assertAuth,
  assertRole,
  assertPolicy,
  assertPolicyOrNotFound,
  validateUserEmployeeLinkage,
  canAccessEmployeeProfile,
  canManageProject,
  assertCanManageProject,
  isProjectManagerOwner,
  canManageAllocation,
  assertCanManageAllocation,
  canViewProject,
  requireLinkedEmployee as requireLinkedEmployeePolicy,
} from '../src/common/auth/policy.js'
import {
  requireRole,
  requireLinkedEmployee as requireLinkedEmployeeMiddleware,
} from '../src/common/auth/rbac.js'
import { hashPassword } from '../src/common/auth/password.js'

describe('RBAC & Authorization Foundation (PRD US01.02 & TSD Section 15.4)', () => {
  const app = createApp({ useMemorySession: true })

  let adminCookie: string
  let adminCsrf: string
  let pmCookie: string
  let pmCsrf: string
  let rmCookie: string
  let employeeCookie: string
  let employeeCsrf: string

  let employeeOwnId: string
  let otherEmployeeId: string
  let pmOwnProjectId: string
  let otherPmProjectId: string

  let createdEmployeeId: string | null = null
  let createdProjectId: string | null = null

  beforeAll(async () => {
    // 1. Authenticate seeded users
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@staffora.internal', password: 'StafforaAdmin2026!' })
    adminCookie = adminRes.headers['set-cookie']?.[0] ?? ''
    adminCsrf = adminRes.body.data.csrfToken

    const pmRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'pm@staffora.internal', password: 'StafforaPM2026!' })
    pmCookie = pmRes.headers['set-cookie']?.[0] ?? ''
    pmCsrf = pmRes.body.data.csrfToken

    const rmRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'rm@staffora.internal', password: 'StafforaRM2026!' })
    rmCookie = rmRes.headers['set-cookie']?.[0] ?? ''

    const empRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'employee@staffora.internal', password: 'StafforaEmp2026!' })
    employeeCookie = empRes.headers['set-cookie']?.[0] ?? ''
    employeeCsrf = empRes.body.data.csrfToken
    employeeOwnId = empRes.body.data.user.employeeId

    // 2. Fetch another employee (David Kurnia - EMP-004)
    const emp4 = await prisma.employee.findUniqueOrThrow({ where: { employeeCode: 'EMP-004' } })
    otherEmployeeId = emp4.id

    // 3. Fetch PM's own project
    const ownProj = await prisma.project.findUniqueOrThrow({ where: { projectCode: 'PRJ-STAFFORA-01' } })
    pmOwnProjectId = ownProj.id

    // 4. Create another PM and another project for cross-PM ownership tests
    const testSuffix = Date.now().toString();
    const dept = await prisma.department.findFirstOrThrow()
    const rolePM = await prisma.jobRole.findFirstOrThrow({ where: { name: 'Project Manager' } })

      const otherPmEmp = await prisma.employee.create({
        data: {
          employeeCode: `TEST-EMP-${testSuffix}`,
          fullName: 'Other PM User',
          workEmail: `other.pm.${testSuffix}@staffora.internal`,
          departmentId: dept.id,
          jobRoleId: rolePM.id,
          status: 'ACTIVE',
      },
    })
      createdEmployeeId = otherPmEmp.id
      const otherProj = await prisma.project.create({
        data: {
          projectCode: `TEST-PRJ-${testSuffix}`,
          name: 'Another PM Project',
          projectManagerEmployeeId: otherPmEmp.id,
          startDate: new Date('2026-11-01T00:00:00Z'),
          endDate: new Date('2026-12-31T00:00:00Z'),
          status: 'PLANNED',
        },
      })
      createdProjectId = otherProj.id
      otherPmProjectId = otherProj.id
  })

   afterAll(async () => {
    // Cleanup hanya data yang benar-benar dibuat oleh test ini
    if (createdProjectId) {
      await prisma.project.deleteMany({ where: { id: createdProjectId } })
    }
    if (createdEmployeeId) {
      await prisma.employee.deleteMany({ where: { id: createdEmployeeId } })
    }
  })

  describe('1. Role Constants & Definitions', () => {
    it('defines standard role constants for all 4 application roles', () => {
      expect(ROLES.ADMIN).toBe('ADMIN')
      expect(ROLES.PROJECT_MANAGER).toBe('PROJECT_MANAGER')
      expect(ROLES.RESOURCE_MANAGER).toBe('RESOURCE_MANAGER')
      expect(ROLES.EMPLOYEE).toBe('EMPLOYEE')
      expect(ROLE_VALUES).toEqual(['ADMIN', 'PROJECT_MANAGER', 'RESOURCE_MANAGER', 'EMPLOYEE'])
    })
  })

  describe('2. Unauthenticated Access Protection (HTTP 401)', () => {
    it('rejects direct API request to /employees without authentication', async () => {
      const res = await request(app).get('/api/v1/employees')
      expect(res.status).toBe(401)
      expect(res.body.code).toBe('UNAUTHORIZED')
      expect(res.body.message).toContain('Authentication required')
      expect(res.body.requestId).toBeDefined()
    })

    it('rejects direct API request to /projects without authentication', async () => {
      const res = await request(app).get('/api/v1/projects')
      expect(res.status).toBe(401)
      expect(res.body.code).toBe('UNAUTHORIZED')
    })

    it('rejects direct API request to /users without authentication', async () => {
      const res = await request(app).get('/api/v1/users')
      expect(res.status).toBe(401)
      expect(res.body.code).toBe('UNAUTHORIZED')
    })
  })

  describe('3. Inactive Account Session Rejection (HTTP 401)', () => {
    it('rejects request from inactive user session', async () => {
      // Create temporary inactive user
      const pw = await hashPassword('TempInactivePass123!')
      const inactiveUser = await prisma.user.create({
        data: {
          normalizedEmail: 'temp.inactive@staffora.internal',
          passwordHash: pw,
          role: 'EMPLOYEE',
          isActive: false,
        },
      })

      // Attempting to authenticate returns 401
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'temp.inactive@staffora.internal', password: 'TempInactivePass123!' })
      expect(loginRes.status).toBe(401)
      expect(loginRes.body.code).toBe('UNAUTHORIZED')

      await prisma.user.delete({ where: { id: inactiveUser.id } })
    })
  })

  describe('4. Role-Based Access Control (HTTP 403 Forbidden)', () => {
    it('rejects EMPLOYEE accessing admin-only /users endpoint', async () => {
      const res = await request(app).get('/api/v1/users').set('Cookie', employeeCookie)
      expect(res.status).toBe(403)
      expect(res.body.code).toBe('FORBIDDEN')
      expect(res.body.message).toBe('You do not have permission to perform this action.')
    })

    it('rejects PROJECT_MANAGER accessing admin-only /users endpoint', async () => {
      const res = await request(app).get('/api/v1/users').set('Cookie', pmCookie)
      expect(res.status).toBe(403)
      expect(res.body.code).toBe('FORBIDDEN')
    })

    it('rejects RESOURCE_MANAGER accessing admin-only /users endpoint', async () => {
      const res = await request(app).get('/api/v1/users').set('Cookie', rmCookie)
      expect(res.status).toBe(403)
      expect(res.body.code).toBe('FORBIDDEN')
    })

    it('allows ADMIN accessing /users endpoint', async () => {
      const res = await request(app).get('/api/v1/users').set('Cookie', adminCookie)
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    it('rejects EMPLOYEE attempting to create an employee resource (RBAC 403 with valid CSRF)', async () => {
      const res = await request(app)
        .post('/api/v1/employees')
        .set('Cookie', employeeCookie)
        .set('X-CSRF-Token', employeeCsrf)
        .send({ employeeCode: 'TEST', fullName: 'Test' })
      expect(res.status).toBe(403)
      expect(res.body.code).toBe('FORBIDDEN')
      expect(res.body.message).toContain('You do not have permission')
    })
  })

  describe('5. Own Employee Profile Access Policy', () => {
    it('allows EMPLOYEE to view their own profile (HTTP 200)', async () => {
      const res = await request(app)
        .get(`/api/v1/employees/${employeeOwnId}`)
        .set('Cookie', employeeCookie)
      expect(res.status).toBe(200)
      expect(res.body.data.id).toBe(employeeOwnId)
    })

    it('disallows EMPLOYEE from viewing another employee profile via non-disclosure (HTTP 404)', async () => {
      const res = await request(app)
        .get(`/api/v1/employees/${otherEmployeeId}`)
        .set('Cookie', employeeCookie)
      expect(res.status).toBe(404)
      expect(res.body.code).toBe('NOT_FOUND')
    })

    it('returns HTTP 404 identically when employee profile does not exist (non-disclosure parity)', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000'
      const res = await request(app)
        .get(`/api/v1/employees/${fakeUuid}`)
        .set('Cookie', employeeCookie)
      expect(res.status).toBe(404)
      expect(res.body.code).toBe('NOT_FOUND')
    })

    it('allows ADMIN, RM, and PM to view any employee profile (HTTP 200)', async () => {
      const adminRes = await request(app)
        .get(`/api/v1/employees/${otherEmployeeId}`)
        .set('Cookie', adminCookie)
      expect(adminRes.status).toBe(200)

      const rmRes = await request(app)
        .get(`/api/v1/employees/${otherEmployeeId}`)
        .set('Cookie', rmCookie)
      expect(rmRes.status).toBe(200)

      const pmRes = await request(app)
        .get(`/api/v1/employees/${otherEmployeeId}`)
        .set('Cookie', pmCookie)
      expect(pmRes.status).toBe(200)
    })
  })

  describe('6. Assigned Project Ownership Policy', () => {
    it('allows PROJECT_MANAGER to update their own assigned project (HTTP 200)', async () => {
      const res = await request(app)
        .patch(`/api/v1/projects/${pmOwnProjectId}`)
        .set('Cookie', pmCookie)
        .set('X-CSRF-Token', pmCsrf)
        .send({ name: 'Updated Staffora Platform' })
      expect(res.status).toBe(200)
      expect(res.body.data.id).toBe(pmOwnProjectId)
      expect(res.body.data.name).toBe('Updated Staffora Platform')

      const persisted = await prisma.project.findUnique({ where: { id: pmOwnProjectId } })
      expect(persisted?.name).toBe('Updated Staffora Platform')
    })

    it('disallows PROJECT_MANAGER from updating another PM project (HTTP 403)', async () => {
      const res = await request(app)
        .patch(`/api/v1/projects/${otherPmProjectId}`)
        .set('Cookie', pmCookie)
        .set('X-CSRF-Token', pmCsrf)
        .send({ name: 'Unauthorized Hijack Attempt' })
      expect(res.status).toBe(403)
      expect(res.body.code).toBe('FORBIDDEN')
      expect(res.body.message).toContain('manage this project')
    })

    it('disallows PROJECT_MANAGER from creating allocation in another PM project (HTTP 403)', async () => {
      const res = await request(app)
        .post('/api/v1/allocations')
        .set('Cookie', pmCookie)
        .set('X-CSRF-Token', pmCsrf)
        .send({
          projectId: otherPmProjectId,
          employeeId: employeeOwnId,
          jobRoleId: (await prisma.jobRole.findFirstOrThrow()).id,
          allocationPercentage: 50,
          startDate: '2026-11-01',
          endDate: '2026-12-01',
        })
      expect(res.status).toBe(403)
      expect(res.body.code).toBe('FORBIDDEN')
      expect(res.body.message).toContain('manage allocations')
    })


    it('allows ADMIN to update any project regardless of assigned PM (HTTP 200)', async () => {
      const res = await request(app)
        .patch(`/api/v1/projects/${otherPmProjectId}`)
        .set('Cookie', adminCookie)
        .set('X-CSRF-Token', adminCsrf)
        .send({ name: 'Admin Overridden Project' })
      expect(res.status).toBe(200)
    })

    it('disallows EMPLOYEE from updating any project (RBAC 403 with valid CSRF)', async () => {
      const res = await request(app)
        .patch(`/api/v1/projects/${pmOwnProjectId}`)
        .set('Cookie', employeeCookie)
        .set('X-CSRF-Token', employeeCsrf)
        .send({ name: 'Employee Mutate Attempt' })
      expect(res.status).toBe(403)
      expect(res.body.code).toBe('FORBIDDEN')
      expect(res.body.message).toContain('You do not have permission')
    })

    it('rejects state-changing request when CSRF token is missing (CSRF protection)', async () => {
      const res = await request(app)
        .patch(`/api/v1/projects/${pmOwnProjectId}`)
        .set('Cookie', employeeCookie)
        .send({ name: 'No CSRF Attempt' })
      expect(res.status).toBe(403)
      expect(res.body.code).toBe('FORBIDDEN')
      expect(res.body.message).toContain('CSRF')
    })
  })

  describe('7. User-to-Employee Linkage Validation & Reusable Policies', () => {
    it('validates employee linkage requirements for EMPLOYEE and PM roles', () => {
      expect(validateUserEmployeeLinkage({ role: 'EMPLOYEE', employeeId: null }).valid).toBe(false)
      expect(validateUserEmployeeLinkage({ role: 'PROJECT_MANAGER', employeeId: '' }).valid).toBe(false)
      expect(validateUserEmployeeLinkage({ role: 'ADMIN', employeeId: null }).valid).toBe(true)
      expect(validateUserEmployeeLinkage({ role: 'EMPLOYEE', employeeId: 'valid-uuid' }).valid).toBe(true)
    })

    it('rejects creating user with non-existent employee ID via Admin API (HTTP 404)', async () => {
      const fakeUuid = '12345678-1234-4234-8234-123456789abc'
      const res = await request(app)
        .post('/api/v1/users')
        .set('Cookie', adminCookie)
        .set('X-CSRF-Token', adminCsrf)
        .send({
          email: 'invalid.linkage@staffora.internal',
          password: 'ValidPassword123!',
          role: 'EMPLOYEE',
          employeeId: fakeUuid,
        })
      expect(res.status).toBe(404)
      expect(res.body.code).toBe('NOT_FOUND')
    })

    it('rejects creating user with already-linked employee ID (HTTP 409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Cookie', adminCookie)
        .set('X-CSRF-Token', adminCsrf)
        .send({
          email: 'duplicate.linkage@staffora.internal',
          password: 'ValidPassword123!',
          role: 'EMPLOYEE',
          employeeId: employeeOwnId,
        })
      expect(res.status).toBe(409)
      expect(res.body.code).toBe('CONFLICT')
      expect(res.body.message).toContain('already linked')
    })

    it('rejects creating EMPLOYEE user without employeeId linkage (HTTP 422)', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Cookie', adminCookie)
        .set('X-CSRF-Token', adminCsrf)
        .send({
          email: `no.linkage.emp.${Date.now()}@staffora.internal`,
          password: 'ValidPassword123!',
          role: 'EMPLOYEE',
        })
      expect(res.status).toBe(422)
      expect(res.body.code).toBe('UNPROCESSABLE_ENTITY')
      expect(res.body.message).toContain('requires linkage')
    })

    it('rejects creating PROJECT_MANAGER user without employeeId linkage (HTTP 422)', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Cookie', adminCookie)
        .set('X-CSRF-Token', adminCsrf)
        .send({
          email: `no.linkage.pm.${Date.now()}@staffora.internal`,
          password: 'ValidPassword123!',
          role: 'PROJECT_MANAGER',
        })
      expect(res.status).toBe(422)
      expect(res.body.code).toBe('UNPROCESSABLE_ENTITY')
      expect(res.body.message).toContain('requires linkage')
    })

    it('rejects updating user to EMPLOYEE role without employee linkage (HTTP 422)', async () => {
      const createRes = await request(app)
        .post('/api/v1/users')
        .set('Cookie', adminCookie)
        .set('X-CSRF-Token', adminCsrf)
        .send({
          email: `temp.admin.${Date.now()}@staffora.internal`,
          password: 'ValidPassword123!',
          role: 'ADMIN',
        })
      const tempUserId = createRes.body.data.id

      const updateRes = await request(app)
        .patch(`/api/v1/users/${tempUserId}`)
        .set('Cookie', adminCookie)
        .set('X-CSRF-Token', adminCsrf)
        .send({
          role: 'EMPLOYEE',
        })
      expect(updateRes.status).toBe(422)
      expect(updateRes.body.code).toBe('UNPROCESSABLE_ENTITY')
      expect(updateRes.body.message).toContain('requires linkage')

      await prisma.user.delete({ where: { id: tempUserId } })
    })

    it('supports non-disclosure behavior throwing 404 instead of 403 when asserted', () => {
      expect(() => {
        assertPolicyOrNotFound(false, true, 'Resource not found.')
      }).toThrowError('Resource not found.')
    })

    it('evaluates unit policy helpers deterministically', () => {
      const userPM = { id: 'u1', email: 'pm@test', role: ROLES.PROJECT_MANAGER, isActive: true, employeeId: 'emp-1' }
      expect(isProjectManagerOwner(userPM, 'emp-1')).toBe(true)
      expect(isProjectManagerOwner(userPM, 'emp-2')).toBe(false)
      expect(isProjectManagerOwner(userPM, null)).toBe(false)
      expect(canManageProject(userPM, 'emp-1')).toBe(true)
      expect(canManageProject(userPM, 'emp-2')).toBe(false)

      const userAdmin = { id: 'u0', email: 'admin@test', role: ROLES.ADMIN, isActive: true, employeeId: null }
      expect(canManageProject(userAdmin, 'emp-other')).toBe(true)
      expect(canViewProject(userAdmin)).toBe(true)

      const userEmp = { id: 'u2', email: 'e@test', role: ROLES.EMPLOYEE, isActive: true, employeeId: 'emp-2' }
      expect(canAccessEmployeeProfile(userEmp, 'emp-2')).toBe(true)
      expect(canAccessEmployeeProfile(userEmp, 'emp-1')).toBe(false)

      // Allocations policy helpers
      const userRM = { id: 'u3', email: 'rm@test', role: ROLES.RESOURCE_MANAGER, isActive: true, employeeId: null }
      expect(canManageAllocation(userAdmin, 'emp-any')).toBe(true)
      expect(canManageAllocation(userRM, 'emp-any')).toBe(true)
      expect(canManageAllocation(userPM, 'emp-1')).toBe(true)
      expect(canManageAllocation(userPM, 'emp-other')).toBe(false)

      expect(() => assertCanManageProject(userPM, 'emp-1')).not.toThrow()
      expect(() => assertCanManageProject(userPM, 'emp-2')).toThrowError('manage this project')

      expect(() => assertCanManageAllocation(userPM, 'emp-1')).not.toThrow()
      expect(() => assertCanManageAllocation(userPM, 'emp-2')).toThrowError('manage allocations')

      // Core assertAuth & assertRole
      expect(() => assertAuth(undefined)).toThrowError('Authentication required')
      expect(() => assertAuth({ ...userAdmin, isActive: false })).toThrowError('inactive')
      expect(() => assertAuth(userAdmin)).not.toThrow()

      expect(() => assertRole(userAdmin, [ROLES.ADMIN])).not.toThrow()
      expect(() => assertRole(userEmp, [ROLES.ADMIN])).toThrowError('permission')

      expect(() => assertPolicy(true)).not.toThrow()
      expect(() => assertPolicy(false)).toThrowError('permission')

      expect(requireLinkedEmployeePolicy(userPM)).toBe('emp-1')
      expect(() => requireLinkedEmployeePolicy(userAdmin)).toThrowError('linked to an employee')
    })

    it('covers RBAC middleware branches directly', () => {
      const mockReq = (user?: Partial<AuthenticatedUser>) => ({ user } as unknown as Request)
      const mockRes = {} as unknown as Response

      // requireRole inactive or unauthenticated
      let errorThrown: unknown = null
      const nextFn = (err?: unknown) => {
        errorThrown = err
      }

      requireRole(ROLES.ADMIN)(mockReq(undefined), mockRes, nextFn)
      expect((errorThrown as AppError)?.statusCode).toBe(401)

      errorThrown = null
      requireRole(ROLES.ADMIN)(mockReq({ role: ROLES.ADMIN, isActive: false }), mockRes, nextFn)
      expect((errorThrown as AppError)?.statusCode).toBe(401)

      // requireLinkedEmployee middleware branches
      errorThrown = null
      requireLinkedEmployeeMiddleware()(mockReq(undefined), mockRes, nextFn)
      expect((errorThrown as AppError)?.statusCode).toBe(401)

      errorThrown = null
      requireLinkedEmployeeMiddleware()(mockReq({ isActive: true, employeeId: null }), mockRes, nextFn)
      expect((errorThrown as AppError)?.statusCode).toBe(403)

      let passed = false
      requireLinkedEmployeeMiddleware()(mockReq({ isActive: true, employeeId: 'valid-id' }), mockRes, () => {
        passed = true
      })
      expect(passed).toBe(true)
    })
  })
})
