import { Router } from 'express'
import { identityController } from './identity.controller.js'
import { validateBody } from '../../common/validation/validate.js'
import { loginSchema, createUserSchema, updateUserSchema } from './identity.schema.js'
import { requireAuth, requireRole } from '../../common/auth/rbac.js'
import { loginRateLimitMiddleware } from '../../common/auth/rate-limiter.js'

export const authRouter = Router()

// Authentication endpoints
authRouter.post('/login', loginRateLimitMiddleware, validateBody(loginSchema), identityController.login)
authRouter.post('/logout', requireAuth(), identityController.logout)
authRouter.get('/me', requireAuth(), identityController.getMe)
authRouter.get('/csrf-token', requireAuth(), identityController.getCsrfToken)

export const usersRouter = Router()

// User management endpoints (Admin only)
usersRouter.use(requireAuth(), requireRole('ADMIN'))
usersRouter.get('/', identityController.listUsers)
usersRouter.post('/', validateBody(createUserSchema), identityController.createUser)
usersRouter.patch('/:id', validateBody(updateUserSchema), identityController.updateUser)
