import type { Request, Response, NextFunction } from 'express'
import { sendSuccess } from '../../common/http/response.js'
import { staffingService } from './staffing.service.js'

export const staffingController = {
  async getRequirementsForProject(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await staffingService.getRequirementsForProject(req.params.id as string)
      return sendSuccess(res, items)
    } catch (err) {
      next(err)
    }
  },

  async createRequirement(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await staffingService.createRequirement(req.params.id as string, req.body, req.user!)
      return res.status(201).json({
        data: item,
        meta: { message: 'Staffing requirement created scaffold' },
      })
    } catch (err) {
      next(err)
    }
  },

  async updateRequirement(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await staffingService.updateRequirement(req.params.id as string, req.body, req.user!)
      return sendSuccess(res, item)
    } catch (err) {
      next(err)
    }
  },

  async deleteRequirement(req: Request, res: Response, next: NextFunction) {
    try {
      await staffingService.deleteRequirement(req.params.id as string, req.user!)
      return res.status(204).send()
    } catch (err) {
      next(err)
    }
  },
}
