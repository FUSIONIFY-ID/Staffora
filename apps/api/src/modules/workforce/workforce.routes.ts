import { Router } from "express";
import { workforceController } from "./workforce.controller.js";
import { requireAuth, requireRole } from "../../common/auth/rbac.js";
import {
  validateBody,
  validateParams,
} from "../../common/validation/validate.js";
import {
  createDepartmentSchema,
  createEmployeeSchema,
  createJobRoleSchema,
  employeeIdParamsSchema,
  updateEmployeeSchema,
} from "./workforce.schema.js";

// Departments Router
export const departmentsRouter = Router();
departmentsRouter.use(requireAuth());
departmentsRouter.get("/", workforceController.getDepartments);
departmentsRouter.post(
  "/",
  requireRole("ADMIN"),
  validateBody(createDepartmentSchema),
  workforceController.createDepartment,
);

// Job Roles Router
export const jobRolesRouter = Router();
jobRolesRouter.use(requireAuth());
jobRolesRouter.get("/", workforceController.getJobRoles);
jobRolesRouter.post(
  "/",
  requireRole("ADMIN"),
  validateBody(createJobRoleSchema),
  workforceController.createJobRole,
);

// Employees Router
export const employeesRouter = Router();
employeesRouter.use(requireAuth());
employeesRouter.get(
  "/",
  requireRole("ADMIN", "PROJECT_MANAGER", "RESOURCE_MANAGER"),
  workforceController.getEmployees,
);
employeesRouter.post(
  "/",
  requireRole("ADMIN", "RESOURCE_MANAGER"),
  validateBody(createEmployeeSchema),
  workforceController.createEmployee,
);
employeesRouter.get(
  "/:id",
  requireRole("ADMIN", "PROJECT_MANAGER", "RESOURCE_MANAGER", "EMPLOYEE"),
  validateParams(employeeIdParamsSchema),
  workforceController.getEmployeeDetail,
);
employeesRouter.patch(
  "/:id",
  requireRole("ADMIN", "RESOURCE_MANAGER"),
  validateParams(employeeIdParamsSchema),
  validateBody(updateEmployeeSchema),
  workforceController.updateEmployee,
);
