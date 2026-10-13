import { Router } from 'express'
import { workforceController } from './workforce.controller.js'
import { requireAuth, requireRole } from '../../common/auth/rbac.js'

/**
 * Workforce routes carry authentication and role gating only. Body, query, and
 * path-parameter validation happens inside the module service, because the
 * shared validate* middleware in common/validation/validate.ts assigns to
 * req.query / req.params, which Express 5 exposes as getter-only and which
 * turns a valid request into a 500.
 */

// Departments Router
export const departmentsRouter = Router()
departmentsRouter.use(requireAuth())
departmentsRouter.get('/', workforceController.getDepartments)
departmentsRouter.post('/', requireRole('ADMIN'), workforceController.createDepartment)

// Job Roles Router
export const jobRolesRouter = Router()
jobRolesRouter.use(requireAuth())
jobRolesRouter.get('/', workforceController.getJobRoles)
jobRolesRouter.post('/', requireRole('ADMIN'), workforceController.createJobRole)

// Employees Router
export const employeesRouter = Router()
employeesRouter.use(requireAuth())
employeesRouter.get(
  '/',
  requireRole('ADMIN', 'PROJECT_MANAGER', 'RESOURCE_MANAGER'),
  workforceController.getEmployees,
)
employeesRouter.post(
  '/',
  requireRole('ADMIN', 'RESOURCE_MANAGER'),
  workforceController.createEmployee,
)
employeesRouter.get(
  '/:id',
  requireRole('ADMIN', 'PROJECT_MANAGER', 'RESOURCE_MANAGER', 'EMPLOYEE'),
  workforceController.getEmployeeDetail,
)
employeesRouter.patch(
  '/:id',
  requireRole('ADMIN', 'RESOURCE_MANAGER'),
  workforceController.updateEmployee,
)
