import type { RequestHandler } from 'express'
import { staffingService } from './staffing.service.js'
import { sendSuccess, sendCreated, sendNoContent } from '../../common/http/response.js'
import { getParam } from '../../common/http/params.js'

export const staffingController = {
  getRequirementsForProject: (async (req, res, next) => {
    try {
      const data = await staffingService.getRequirementsForProject(getParam(req.params.id))
      return sendSuccess(res, data)
    } catch (err) {
      next(err)
    }
  }) as RequestHandler,

  createRequirement: (async (req, res, next) => {
    try {
      const data = await staffingService.createRequirement(getParam(req.params.id), req.body, req.user!)
      return sendCreated(res, data)
    } catch (err) {
      next(err)
    }
  }) as RequestHandler,

  updateRequirement: (async (req, res, next) => {
    try {
      const data = await staffingService.updateRequirement(getParam(req.params.id), req.body, req.user!)
      return sendSuccess(res, data)
    } catch (err) {
      next(err)
    }
  }) as RequestHandler,

  deleteRequirement: (async (req, res, next) => {
    try {
      await staffingService.deleteRequirement(getParam(req.params.id), req.user!)
      return sendNoContent(res)
    } catch (err) {
      next(err)
    }
  }) as RequestHandler,
}
