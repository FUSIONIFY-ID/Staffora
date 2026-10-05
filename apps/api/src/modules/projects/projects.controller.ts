import type { Request, Response, NextFunction } from 'express'
import { sendSuccess, sendList } from '../../common/http/response.js'
import { projectsService } from './projects.service.js'

export const projectsController = {
  async getProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await projectsService.getProjects(req.query, req.user!)
      return sendList(res, result.data, {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
      })
    } catch (err) {
      next(err)
    }
  },

  async createProject(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await projectsService.createProject(req.body, req.user!)
      return res.status(201).json({
        data: project,
        meta: { message: 'Create project scaffold - Ready for Sprint 1 development' },
      })
    } catch (err) {
      next(err)
    }
  },

  async getProjectDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await projectsService.getProjectDetail(req.params.id as string, req.user!)
      return sendSuccess(res, project)
    } catch (err) {
      next(err)
    }
  },

  async updateProject(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await projectsService.updateProject(req.params.id as string, req.body, req.user!)
      return sendSuccess(res, updated)
    } catch (err) {
      next(err)
    }
  },
}
