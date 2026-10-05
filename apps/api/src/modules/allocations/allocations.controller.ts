import type { RequestHandler } from 'express'
import { allocationsService } from './allocations.service.js'
import { sendSuccess, sendCreated } from '../../common/http/response.js'
import { getParam } from '../../common/http/params.js'

export const allocationsController = {
  getAllocations: (async (req, res, next) => {
    try {
      const data = await allocationsService.getAllocations({
        employeeId: req.query.employeeId as string | undefined,
        projectId: req.query.projectId as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
      })
      return sendSuccess(res, data)
    } catch (err) {
      next(err)
    }
  }) as RequestHandler,

  getAllocationById: (async (req, res, next) => {
    try {
      const data = await allocationsService.getAllocationById(getParam(req.params.id))
      return sendSuccess(res, data)
    } catch (err) {
      next(err)
    }
  }) as RequestHandler,

  createAllocation: (async (req, res, next) => {
    try {
      const data = await allocationsService.createAllocation(req.body, req.user!)
      return sendCreated(res, data)
    } catch (err) {
      next(err)
    }
  }) as RequestHandler,

  updateAllocation: (async (req, res, next) => {
    try {
      const data = await allocationsService.updateAllocation(getParam(req.params.id), req.body, req.user!)
      return sendSuccess(res, data)
    } catch (err) {
      next(err)
    }
  }) as RequestHandler,

  endAllocation: (async (req, res, next) => {
    try {
      const data = await allocationsService.endAllocation(getParam(req.params.id), req.body.endDate, req.user!)
      return sendSuccess(res, data)
    } catch (err) {
      next(err)
    }
  }) as RequestHandler,

  cancelAllocation: (async (req, res, next) => {
    try {
      const data = await allocationsService.cancelAllocation(getParam(req.params.id), req.user!)
      return sendSuccess(res, data)
    } catch (err) {
      next(err)
    }
  }) as RequestHandler,
}
