import { Router } from "express";
import { staffingController } from "./staffing.controller.js";
import {
  validateBody,
  validateParams,
  uuidParamSchema,
} from "../../common/validation/validate.js";
import {
  createStaffingRequirementSchema,
  updateStaffingRequirementSchema,
} from "./staffing.schema.js";
import { requireAuth, requireRole } from "../../common/auth/rbac.js";

// Sub-router mounted under /api/v1/projects/:id/staffing-requirements
export const projectStaffingRouter = Router({ mergeParams: true });
projectStaffingRouter.use(requireAuth());

projectStaffingRouter.get("/", staffingController.getRequirementsForProject);
projectStaffingRouter.post(
  "/",
  requireRole("ADMIN", "PROJECT_MANAGER"),
  validateBody(createStaffingRequirementSchema),
  staffingController.createRequirement,
);

// Standalone router mounted under /api/v1/staffing-requirements
export const staffingRouter = Router();
staffingRouter.use(requireAuth());

staffingRouter.patch(
  "/:id",
  requireRole("ADMIN", "PROJECT_MANAGER"),
  validateParams(uuidParamSchema),
  validateBody(updateStaffingRequirementSchema),
  staffingController.updateRequirement,
);
staffingRouter.delete(
  "/:id",
  requireRole("ADMIN", "PROJECT_MANAGER"),
  validateParams(uuidParamSchema),
  staffingController.deleteRequirement,
);
