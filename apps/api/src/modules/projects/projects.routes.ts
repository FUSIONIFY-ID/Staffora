import { Router } from 'express'
import { projectsController } from './projects.controller.js'
import { validateBody, validateQuery } from '../../common/validation/validate.js'
import { createProjectSchema, updateProjectSchema, queryProjectsSchema } from './projects.schema.js'
import { requireAuth, requireRole } from '../../common/auth/rbac.js'

export const projectsRouter = Router()

projectsRouter.use(requireAuth())

projectsRouter.get('/', validateQuery(queryProjectsSchema), projectsController.getProjects)
projectsRouter.post(
  '/',
  requireRole('ADMIN', 'PROJECT_MANAGER'),
  validateBody(createProjectSchema),
  projectsController.createProject,
)
projectsRouter.get('/:id', projectsController.getProjectDetail)
projectsRouter.patch(
  '/:id',
  requireRole('ADMIN', 'PROJECT_MANAGER'),
  validateBody(updateProjectSchema),
  projectsController.updateProject,
)
