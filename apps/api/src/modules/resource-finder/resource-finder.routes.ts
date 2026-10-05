import { Router } from 'express'
import { resourceFinderController } from './resource-finder.controller.js'
import { validateQuery } from '../../common/validation/validate.js'
import { resourceFinderQuerySchema } from './resource-finder.schema.js'
import { requireAuth, requireRole } from '../../common/auth/rbac.js'

export const resourceFinderRouter = Router()

resourceFinderRouter.use(requireAuth(), requireRole('ADMIN', 'PROJECT_MANAGER', 'RESOURCE_MANAGER'))

resourceFinderRouter.get('/', validateQuery(resourceFinderQuerySchema), resourceFinderController.search)
