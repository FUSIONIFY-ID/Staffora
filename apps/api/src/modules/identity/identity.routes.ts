import { Router } from "express";
import { identityController } from "./identity.controller.js";
import {
  validateBody,
  validateParams,
  uuidParamSchema,
} from "../../common/validation/validate.js";
import {
  loginSchema,
  createUserSchema,
  updateUserSchema,
} from "./identity.schema.js";
import { requireAuth, requireRole } from "../../common/auth/rbac.js";
import { loginRateLimitMiddleware } from "../../common/auth/rate-limiter.js";

export const authRouter = Router();

// Authentication endpoints
authRouter.post(
  "/login",
  loginRateLimitMiddleware,
  validateBody(loginSchema),
  identityController.login,
);
authRouter.post("/logout", requireAuth(), identityController.logout);
authRouter.get("/me", requireAuth(), identityController.getMe);
// Public on purpose: sign-in is CSRF-protected too, so a browser without a login session needs a
// token issued on its anonymous session first. Login then rotates the session and the token.
authRouter.get("/csrf-token", identityController.getCsrfToken);

export const usersRouter = Router();

// User management endpoints (Admin only)
usersRouter.use(requireAuth(), requireRole("ADMIN"));
usersRouter.get("/", identityController.listUsers);
usersRouter.post(
  "/",
  validateBody(createUserSchema),
  identityController.createUser,
);
usersRouter.patch(
  "/:id",
  validateParams(uuidParamSchema),
  validateBody(updateUserSchema),
  identityController.updateUser,
);
