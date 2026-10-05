import { Router } from 'express'
import { skillsController } from './skills.controller.js'
import { validateBody } from '../../common/validation/validate.js'
import { createSkillSchema, assignSkillSchema, updateProficiencySchema } from './skills.schema.js'
import { requireAuth, requireRole } from '../../common/auth/rbac.js'

export const skillsRouter = Router()

skillsRouter.use(requireAuth())

// Skills catalog
skillsRouter.get('/', skillsController.getSkills)
skillsRouter.post('/', requireRole('ADMIN', 'RESOURCE_MANAGER'), validateBody(createSkillSchema), skillsController.createSkill)

// Employee skill assignment sub-routes (also mountable directly or under /employees/:id/skills)
export const employeeSkillsRouter = Router({ mergeParams: true })
employeeSkillsRouter.use(requireAuth())

employeeSkillsRouter.get('/', skillsController.getEmployeeSkills)
employeeSkillsRouter.post(
  '/',
  requireRole('ADMIN', 'RESOURCE_MANAGER'),
  validateBody(assignSkillSchema),
  skillsController.assignSkill,
)
employeeSkillsRouter.patch(
  '/:skillId',
  requireRole('ADMIN', 'RESOURCE_MANAGER'),
  validateBody(updateProficiencySchema),
  skillsController.updateProficiency,
)
employeeSkillsRouter.delete(
  '/:skillId',
  requireRole('ADMIN', 'RESOURCE_MANAGER'),
  skillsController.removeSkill,
)
