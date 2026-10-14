import { Router } from 'express'
import { workforceController } from './workforce.controller.js'
import { requireAuth, requireRole } from '../../common/auth/rbac.js'
import { validateBody, validateParams } from '../../common/validation/validate.js'
import {
  createDepartmentSchema,
  createEmployeeSchema,
  createJobRoleSchema,
  employeeIdParamsSchema,
  updateEmployeeSchema,
} from './workforce.schema.js'

/**
 * Body and path-parameter validation runs as middleware, per CODING_STANDARD
 * 3.3. Query strings are the one exception: the shared `validateQuery` assigns
 * to `req.query`, which Express 5 exposes as getter-only, so any request whose
 * schema parses successfully would fail with a 500. PR #6 replaces that
 * assignment with Object.defineProperty; until it merges, the two list/detail
 * routes parse their query in the controller through workforce.query.ts. The
 * schemas are already the shared ones, so switching over is a one-line change.
 */

// Departments Router
export const departmentsRouter = Router()
departmentsRouter.use(requireAuth())
departmentsRouter.get('/', workforceController.getDepartments)
departmentsRouter.post(
  '/',
  requireRole('ADMIN'),
  validateBody(createDepartmentSchema),
  workforceController.createDepartment,
)

// Job Roles Router
export const jobRolesRouter = Router()
jobRolesRouter.use(requireAuth())
jobRolesRouter.get('/', workforceController.getJobRoles)
jobRolesRouter.post(
  '/',
  requireRole('ADMIN'),
  validateBody(createJobRoleSchema),
  workforceController.createJobRole,
)

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
  validateBody(createEmployeeSchema),
  workforceController.createEmployee,
)
employeesRouter.get(
  '/:id',
  requireRole('ADMIN', 'PROJECT_MANAGER', 'RESOURCE_MANAGER', 'EMPLOYEE'),
  validateParams(employeeIdParamsSchema),
  workforceController.getEmployeeDetail,
)
employeesRouter.patch(
  '/:id',
  requireRole('ADMIN', 'RESOURCE_MANAGER'),
  validateParams(employeeIdParamsSchema),
  validateBody(updateEmployeeSchema),
  workforceController.updateEmployee,
)
