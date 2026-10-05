import type { RequestHandler } from 'express'
import { projectsService } from './projects.service.js'
import { sendSuccess, sendCreated, sendList } from '../../common/http/response.js'
import { getParam } from '../../common/http/params.js'
import type { ProjectStatus } from '../../generated/prisma/client.js'

export const projectsController = {
  getProjects: (async (req, res, next) => {
    try {
      const result = await projectsService.getProjects(
        {
          search: req.query.search as string | undefined,
          status: req.query.status as ProjectStatus | undefined,
          projectManagerEmployeeId: req.query.projectManagerEmployeeId as string | undefined,
          page: Number(req.query.page) || 1,
          pageSize: Number(req.query.pageSize) || 20,
        },
        req.user!,
      )
      return sendList(res, result.data, {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
      })
    } catch (err) {
      next(err)
    }
  }) as RequestHandler,

  getProjectDetail: (async (req, res, next) => {
    try {
      const data = await projectsService.getProjectDetail(getParam(req.params.id), req.user!)
      return sendSuccess(res, data)
    } catch (err) {
      next(err)
    }
  }) as RequestHandler,

  createProject: (async (req, res, next) => {
    try {
      const data = await projectsService.createProject(req.body, req.user!)
      return sendCreated(res, data)
    } catch (err) {
      next(err)
    }
  }) as RequestHandler,

  updateProject: (async (req, res, next) => {
    try {
      const data = await projectsService.updateProject(getParam(req.params.id), req.body, req.user!)
      return sendSuccess(res, data)
    } catch (err) {
      next(err)
    }
  }) as RequestHandler,
}
