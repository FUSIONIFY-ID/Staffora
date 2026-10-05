import { Router } from 'express'
import { allocationsController } from './allocations.controller.js'
import { validateBody } from '../../common/validation/validate.js'
import {
  createAllocationSchema,
  updateAllocationSchema,
  endAllocationSchema,
} from './allocations.schema.js'
import { requireAuth, requireRole } from '../../common/auth/rbac.js'

export const allocationsRouter = Router()

allocationsRouter.use(requireAuth())

allocationsRouter.get('/', allocationsController.getAllocations)
allocationsRouter.get('/:id', allocationsController.getAllocationById)

allocationsRouter.post(
  '/',
  requireRole('ADMIN', 'PROJECT_MANAGER', 'RESOURCE_MANAGER'),
  validateBody(createAllocationSchema),
  allocationsController.createAllocation,
)

allocationsRouter.patch(
  '/:id',
  requireRole('ADMIN', 'PROJECT_MANAGER', 'RESOURCE_MANAGER'),
  validateBody(updateAllocationSchema),
  allocationsController.updateAllocation,
)

allocationsRouter.post(
  '/:id/end',
  requireRole('ADMIN', 'PROJECT_MANAGER', 'RESOURCE_MANAGER'),
  validateBody(endAllocationSchema),
  allocationsController.endAllocation,
)

allocationsRouter.post(
  '/:id/cancel',
  requireRole('ADMIN', 'PROJECT_MANAGER', 'RESOURCE_MANAGER'),
  allocationsController.cancelAllocation,
)
