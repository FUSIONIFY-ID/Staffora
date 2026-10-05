import type { Request, Response, NextFunction } from 'express'
import { sendSuccess } from '../../common/http/response.js'
import { resourceFinderService } from './resource-finder.service.js'

export const resourceFinderController = {
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const results = await resourceFinderService.search(req.query)
      return sendSuccess(res, results)
    } catch (err) {
      next(err)
    }
  },
}
