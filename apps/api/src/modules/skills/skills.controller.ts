import type { RequestHandler } from 'express'
import { skillsService } from './skills.service.js'
import { sendSuccess, sendCreated, sendNoContent } from '../../common/http/response.js'
import { getParam } from '../../common/http/params.js'

export const skillsController = {
  getSkills: (async (_req, res, next) => {
    try {
      const data = await skillsService.getSkills()
      return sendSuccess(res, data)
    } catch (err) {
      next(err)
    }
  }) as RequestHandler,

  createSkill: (async (req, res, next) => {
    try {
      const data = await skillsService.createSkill(req.body.name, req.user?.id)
      return sendCreated(res, data)
    } catch (err) {
      next(err)
    }
  }) as RequestHandler,

  getEmployeeSkills: (async (req, res, next) => {
    try {
      const data = await skillsService.getEmployeeSkills(getParam(req.params.id))
      return sendSuccess(res, data)
    } catch (err) {
      next(err)
    }
  }) as RequestHandler,

  assignSkill: (async (req, res, next) => {
    try {
      const data = await skillsService.assignSkill(
        getParam(req.params.id),
        req.body.skillId,
        req.body.proficiencyLevel,
        req.user?.id,
      )
      return sendCreated(res, data)
    } catch (err) {
      next(err)
    }
  }) as RequestHandler,

  updateProficiency: (async (req, res, next) => {
    try {
      const data = await skillsService.updateProficiency(
        getParam(req.params.id),
        getParam(req.params.skillId),
        req.body.proficiencyLevel,
        req.user?.id,
      )
      return sendSuccess(res, data)
    } catch (err) {
      next(err)
    }
  }) as RequestHandler,

  removeSkill: (async (req, res, next) => {
    try {
      await skillsService.removeSkill(getParam(req.params.id), getParam(req.params.skillId))
      return sendNoContent(res)
    } catch (err) {
      next(err)
    }
  }) as RequestHandler,
}
