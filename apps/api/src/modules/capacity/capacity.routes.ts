import { Router } from "express";
import { requireAuth, requireRole } from "../../common/auth/rbac.js";
import {
  validateParams,
  uuidParamSchema,
} from "../../common/validation/validate.js";
import { NotImplementedError } from "../../common/errors/app-error.js";

export const capacityRouter = Router();

capacityRouter.use(requireAuth());

capacityRouter.get(
  "/",
  requireRole("ADMIN", "RESOURCE_MANAGER", "PROJECT_MANAGER"),
  async (_req, _res, next) => {
    try {
      throw new NotImplementedError(
        "Capacity timeline query is not implemented in Sprint 1.",
      );
    } catch (err) {
      next(err);
    }
  },
);

capacityRouter.get(
  "/employees/:id",
  validateParams(uuidParamSchema),
  async (_req, _res, next) => {
    try {
      throw new NotImplementedError(
        "Single employee capacity timeline is not implemented in Sprint 1.",
      );
    } catch (err) {
      next(err);
    }
  },
);
