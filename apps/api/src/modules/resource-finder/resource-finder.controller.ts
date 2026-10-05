import type { RequestHandler } from 'express'
import { resourceFinderService } from './resource-finder.service.js'

export const resourceFinderController = {
  search: (async (req, res, next) => {
    try {
      const result = await resourceFinderService.searchResources({
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        jobRoleId: req.query.jobRoleId as string | undefined,
        departmentId: req.query.departmentId as string | undefined,
        skillId: req.query.skillId as string | undefined,
        minProficiency: req.query.minProficiency ? Number(req.query.minProficiency) : undefined,
        minRemainingCapacity: req.query.minRemainingCapacity ? Number(req.query.minRemainingCapacity) : undefined,
      })
      return res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  }) as RequestHandler,
}
