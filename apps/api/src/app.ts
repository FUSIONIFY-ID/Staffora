import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { pinoHttp } from 'pino-http'
import { logger } from './common/logging/logger.js'
import { requestIdMiddleware } from './common/http/request-id.js'
import { createSessionMiddleware } from './common/auth/session.js'
import { identityLoaderMiddleware } from './common/auth/identity-loader.js'
import { csrfProtectionMiddleware } from './common/auth/csrf.js'
import { generalRateLimitMiddleware } from './common/auth/rate-limiter.js'
import { errorHandler } from './common/errors/error-handler.js'
import { NotFoundError } from './common/errors/app-error.js'

// Domain routes
import { healthRouter } from './modules/health/health.routes.js'
import { authRouter, usersRouter } from './modules/identity/identity.routes.js'
import {
  departmentsRouter,
  jobRolesRouter,
  employeesRouter,
} from './modules/workforce/workforce.routes.js'
import { skillsRouter, employeeSkillsRouter } from './modules/skills/skills.routes.js'
import { projectsRouter } from './modules/projects/projects.routes.js'
import { projectStaffingRouter, staffingRouter } from './modules/staffing/staffing.routes.js'
import { allocationsRouter } from './modules/allocations/allocations.routes.js'
import { resourceFinderRouter } from './modules/resource-finder/resource-finder.routes.js'
import { capacityRouter } from './modules/capacity/capacity.routes.js'
import { dashboardRouter, meRouter } from './modules/dashboard/dashboard.routes.js'

export function createApp(options?: {
  useMemorySession?: boolean
}) {
  const app = express()
  app.disable('x-powered-by')

  // 1. Request ID
  app.use(requestIdMiddleware)

  // 2. Pino HTTP logger with sensitive field redaction
  app.use(pinoHttp({ logger }))

  // 3. Helmet security headers
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: false,
    }),
  )

  // 4. CORS allowlist (TSD 8.3)
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    ...(process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN] : []),
  ]
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true)
        } else {
          callback(null, false)
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'X-Request-Id'],
    }),
  )

  // 5. JSON / body parser with 1 MB limit (TSD 7.3 & 13)
  app.use(express.json({ limit: '1mb' }))

  // 6. PostgreSQL-backed session middleware
  app.use(
    createSessionMiddleware({
      useMemoryStore: options?.useMemorySession,
    }),
  )

  // 7. Authenticated identity loader
  app.use(identityLoaderMiddleware)

  // 8. CSRF validation on state-changing endpoints
  app.use(csrfProtectionMiddleware)

  // General API rate limiting (TSD 8.5)
  app.use('/api/v1', generalRateLimitMiddleware)

  // 9. /api/v1 Application Routes
  const apiV1 = express.Router()

  apiV1.use('/health', healthRouter)
  apiV1.use('/auth', authRouter)
  apiV1.use('/users', usersRouter)
  apiV1.use('/departments', departmentsRouter)
  apiV1.use('/job-roles', jobRolesRouter)
  apiV1.use('/employees', employeesRouter)
  apiV1.use('/employees/:id/skills', employeeSkillsRouter)
  apiV1.use('/skills', skillsRouter)
  apiV1.use('/projects', projectsRouter)
  apiV1.use('/projects/:id/staffing-requirements', projectStaffingRouter)
  apiV1.use('/staffing-requirements', staffingRouter)
  apiV1.use('/allocations', allocationsRouter)
  apiV1.use('/resource-finder', resourceFinderRouter)
  apiV1.use('/capacity', capacityRouter)
  apiV1.use('/dashboard', dashboardRouter)
  apiV1.use('/me', meRouter)

  app.use('/api/v1', apiV1)

  // 10. Not-found handler
  app.use((_req, _res, next) => {
    next(new NotFoundError('The requested endpoint was not found.'))
  })

  // 11. Central error handler
  app.use(errorHandler)

  return app
}
