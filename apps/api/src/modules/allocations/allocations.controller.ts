import type { Request, Response, NextFunction } from 'express'
import { sendSuccess, sendList } from '../../common/http/response.js'
import { allocationsService } from './allocations.service.js'

export const allocationsController = {
  async getAllocations(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await allocationsService.getAllocations(req.query, req.user!)
      return sendList(res, result.data, {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
      })
    } catch (err) {
      next(err)
    }
  },

  async getAllocationById(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await allocationsService.getAllocationById(req.params.id as string, req.user!)
      return sendSuccess(res, item)
    } catch (err) {
      next(err)
    }
  },

  async createAllocation(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await allocationsService.createAllocation(req.body, req.user!)
      return res.status(201).json({
        data: item,
        meta: { message: 'Allocation created scaffold' },
      })
    } catch (err) {
      next(err)
    }
  },

  async updateAllocation(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await allocationsService.updateAllocation(req.params.id as string, req.body, req.user!)
      return sendSuccess(res, item)
    } catch (err) {
      next(err)
    }
  },

  async endAllocation(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await allocationsService.endAllocation(req.params.id as string, req.body, req.user!)
      return sendSuccess(res, item)
    } catch (err) {
      next(err)
    }
  },

  async cancelAllocation(req: Request, res: Response, next: NextFunction) {
    try {
      await allocationsService.cancelAllocation(req.params.id as string, req.user!)
      return res.status(204).send()
    } catch (err) {
      next(err)
    }
  },
}
