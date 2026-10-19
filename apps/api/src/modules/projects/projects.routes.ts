import { Router } from "express";
import { projectsController } from "./projects.controller.js";
import {
  validateBody,
  validateQuery,
  validateParams,
  uuidParamSchema,
} from "../../common/validation/validate.js";
import {
  createProjectSchema,
  updateProjectSchema,
  queryProjectsSchema,
} from "./projects.schema.js";
import { requireAuth, requireRole } from "../../common/auth/rbac.js";

export const projectsRouter = Router();

projectsRouter.use(requireAuth());

projectsRouter.get(
  "/",
  validateQuery(queryProjectsSchema),
  projectsController.getProjects,
);
projectsRouter.post(
  "/",
  requireRole("ADMIN", "PROJECT_MANAGER"),
  validateBody(createProjectSchema),
  projectsController.createProject,
);
projectsRouter.get(
  "/:id",
  validateParams(uuidParamSchema),
  projectsController.getProjectDetail,
);
projectsRouter.patch(
  "/:id",
  requireRole("ADMIN", "PROJECT_MANAGER"),
  validateParams(uuidParamSchema),
  validateBody(updateProjectSchema),
  projectsController.updateProject,
);
