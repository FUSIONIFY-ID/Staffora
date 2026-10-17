import { Router } from "express";
import { requireAuth } from "../../common/auth/rbac.js";
import { NotImplementedError } from "../../common/errors/app-error.js";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth());

dashboardRouter.get("/", async (_req, _res, next) => {
  try {
    throw new NotImplementedError(
      "Dashboard metrics aggregation is not implemented in Sprint 1.",
    );
  } catch (err) {
    next(err);
  }
});

export const meRouter = Router();
meRouter.use(requireAuth());

meRouter.get("/", async (_req, _res, next) => {
  try {
    throw new NotImplementedError(
      "Employee self profile view is not implemented in Sprint 1.",
    );
  } catch (err) {
    next(err);
  }
});
