import { Router } from "express";
import { skillsController } from "./skills.controller.js";
import { requireAuth, requireRole } from "../../common/auth/rbac.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../common/validation/validate.js";
import {
  assignSkillSchema,
  createSkillSchema,
  employeeIdParamsSchema,
  employeeSkillParamsSchema,
  listEmployeeSkillsQuerySchema,
  listSkillsQuerySchema,
  skillIdParamsSchema,
  updateProficiencySchema,
  updateSkillSchema,
} from "./skills.schema.js";

// Skill catalog Router (mounted at /skills)
export const skillsRouter = Router();
skillsRouter.use(requireAuth());

skillsRouter.get(
  "/",
  requireRole("ADMIN", "PROJECT_MANAGER", "RESOURCE_MANAGER"),
  validateQuery(listSkillsQuerySchema),
  skillsController.getSkills,
);
skillsRouter.post(
  "/",
  requireRole("ADMIN", "RESOURCE_MANAGER"),
  validateBody(createSkillSchema),
  skillsController.createSkill,
);
skillsRouter.patch(
  "/:id",
  requireRole("ADMIN", "RESOURCE_MANAGER"),
  validateParams(skillIdParamsSchema),
  validateBody(updateSkillSchema),
  skillsController.updateSkill,
);

// Employee skill assignment Router (mounted at /employees/:id/skills)
export const employeeSkillsRouter = Router({ mergeParams: true });
employeeSkillsRouter.use(requireAuth());

employeeSkillsRouter.get(
  "/",
  requireRole("ADMIN", "PROJECT_MANAGER", "RESOURCE_MANAGER", "EMPLOYEE"),
  validateParams(employeeIdParamsSchema),
  validateQuery(listEmployeeSkillsQuerySchema),
  skillsController.getEmployeeSkills,
);
employeeSkillsRouter.post(
  "/",
  requireRole("ADMIN", "RESOURCE_MANAGER"),
  validateParams(employeeIdParamsSchema),
  validateBody(assignSkillSchema),
  skillsController.assignSkill,
);
employeeSkillsRouter.patch(
  "/:skillId",
  requireRole("ADMIN", "RESOURCE_MANAGER"),
  validateParams(employeeSkillParamsSchema),
  validateBody(updateProficiencySchema),
  skillsController.updateProficiency,
);
employeeSkillsRouter.delete(
  "/:skillId",
  requireRole("ADMIN", "RESOURCE_MANAGER"),
  validateParams(employeeSkillParamsSchema),
  skillsController.removeEmployeeSkill,
);
