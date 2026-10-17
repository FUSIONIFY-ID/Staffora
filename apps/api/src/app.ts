import express, { type Express } from "express";
import helmet from "helmet";
import cors from "cors";
import { pinoHttp, stdSerializers } from "pino-http";
import { logger } from "./common/logging/logger.js";
import { requestIdMiddleware } from "./common/http/request-id.js";
import { createSessionMiddleware } from "./common/auth/session.js";
import { identityLoaderMiddleware } from "./common/auth/identity-loader.js";
import { csrfProtectionMiddleware } from "./common/auth/csrf.js";
import { generalRateLimitMiddleware } from "./common/auth/rate-limiter.js";
import { errorHandler } from "./common/errors/error-handler.js";
import { NotFoundError } from "./common/errors/app-error.js";
import {
  validateParams,
  uuidParamSchema,
} from "./common/validation/validate.js";
import { loadEnv } from "./config/env.js";

// Domain routes
import { healthRouter } from "./modules/health/health.routes.js";
import { authRouter, usersRouter } from "./modules/identity/identity.routes.js";
import {
  departmentsRouter,
  jobRolesRouter,
  employeesRouter,
} from "./modules/workforce/workforce.routes.js";
import {
  skillsRouter,
  employeeSkillsRouter,
} from "./modules/skills/skills.routes.js";
import { projectsRouter } from "./modules/projects/projects.routes.js";
import {
  projectStaffingRouter,
  staffingRouter,
} from "./modules/staffing/staffing.routes.js";
import { allocationsRouter } from "./modules/allocations/allocations.routes.js";
import { resourceFinderRouter } from "./modules/resource-finder/resource-finder.routes.js";
import { capacityRouter } from "./modules/capacity/capacity.routes.js";
import {
  dashboardRouter,
  meRouter,
} from "./modules/dashboard/dashboard.routes.js";

const TRUSTED_PROXY_HOPS = 1;

export function createApp(options?: { useMemorySession?: boolean }): Express {
  const app = express();
  const isProduction = loadEnv().NODE_ENV === "production";
  app.disable("x-powered-by");

  // Nginx terminates TLS in staging/production (ADR-007); trusting that single hop lets
  // express-session see HTTPS and issue the Secure session cookie.
  if (isProduction) {
    app.set("trust proxy", TRUSTED_PROXY_HOPS);
  }

  // 1. Request ID
  app.use(requestIdMiddleware);

  // 2. Pino HTTP logger with sensitive field redaction
  //
  // The logged URL keeps the path but drops the query string: `GET
  // /api/v1/employees?search=<person name>` would otherwise write a colleague's
  // name into the log, and redaction alone cannot reach inside a URL. The
  // `search` field of the parsed query object is redacted as well, so the
  // parameter is not recoverable from either field.
  app.use(
    pinoHttp({
      logger,
      serializers: {
        req: (req) => {
          const serialized = stdSerializers.req(req);
          return { ...serialized, url: serialized.url?.split("?")[0] };
        },
      },
    }),
  );

  // 3. Helmet security headers
  app.use(
    helmet({
      contentSecurityPolicy: isProduction,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // 4. CORS allowlist (TSD 8.3)
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    ...(process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN] : []),
  ];
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "X-CSRF-Token", "X-Request-Id"],
    }),
  );

  // 5. JSON / body parser with 1 MB limit (TSD 7.3 & 13)
  app.use(express.json({ limit: "1mb" }));

  // 6. PostgreSQL-backed session middleware
  app.use(
    createSessionMiddleware({
      useMemoryStore: options?.useMemorySession,
    }),
  );

  // 7. Authenticated identity loader
  app.use(identityLoaderMiddleware);

  // 8. CSRF validation on state-changing endpoints
  app.use(csrfProtectionMiddleware);

  // General API rate limiting (TSD 8.5)
  app.use("/api/v1", generalRateLimitMiddleware);

  // 9. /api/v1 Application Routes
  const apiV1 = express.Router();

  apiV1.use("/health", healthRouter);
  apiV1.use("/auth", authRouter);
  apiV1.use("/users", usersRouter);
  apiV1.use("/departments", departmentsRouter);
  apiV1.use("/job-roles", jobRolesRouter);
  apiV1.use("/employees", employeesRouter);
  apiV1.use(
    "/employees/:id/skills",
    validateParams(uuidParamSchema),
    employeeSkillsRouter,
  );
  apiV1.use("/skills", skillsRouter);
  apiV1.use("/projects", projectsRouter);
  apiV1.use(
    "/projects/:id/staffing-requirements",
    validateParams(uuidParamSchema),
    projectStaffingRouter,
  );
  apiV1.use("/staffing-requirements", staffingRouter);
  apiV1.use("/allocations", allocationsRouter);
  apiV1.use("/resource-finder", resourceFinderRouter);
  apiV1.use("/capacity", capacityRouter);
  apiV1.use("/dashboard", dashboardRouter);
  apiV1.use("/me", meRouter);

  app.use("/api/v1", apiV1);

  // 10. Not-found handler
  app.use((_req, _res, next) => {
    next(new NotFoundError("The requested endpoint was not found."));
  });

  // 11. Central error handler
  app.use(errorHandler);

  return app;
}
