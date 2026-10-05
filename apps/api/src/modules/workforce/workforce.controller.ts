import type { RequestHandler } from 'express'
import { workforceService } from './workforce.service.js'
import { sendSuccess, sendCreated, sendList } from '../../common/http/response.js'
import { getParam } from '../../common/http/params.js'

export const workforceController = {
  getDepartments: (async (_req, res, next) => {
    try {
      const data = await workforceService.getDepartments()
      return sendSuccess(res, data)
    } catch (err) {
      next(err)
    }
  }) as RequestHandler,

  createDepartment: (async (req, res, next) => {
    try {
      const data = await workforceService.createDepartment(req.body.name, req.user?.id)
      return sendCreated(res, data)
    } catch (err) {
      next(err)
    }
  }) as RequestHandler,

  getJobRoles: (async (_req, res, next) => {
    try {
      const data = await workforceService.getJobRoles()
      return sendSuccess(res, data)
    } catch (err) {
      next(err)
    }
  }) as RequestHandler,

  createJobRole: (async (req, res, next) => {
    try {
      const data = await workforceService.createJobRole(req.body.name, req.user?.id)
      return sendCreated(res, data)
    } catch (err) {
      next(err)
    }
  }) as RequestHandler,

  getEmployees: (async (req, res, next) => {
    try {
      const result = await workforceService.getEmployees({
        search: req.query.search as string | undefined,
        departmentId: req.query.departmentId as string | undefined,
        jobRoleId: req.query.jobRoleId as string | undefined,
        status: req.query.status as 'ACTIVE' | 'INACTIVE' | undefined,
        page: Number(req.query.page) || 1,
        pageSize: Number(req.query.pageSize) || 20,
      })
      return sendList(res, result.data, {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
      })
    } catch (err) {
      next(err)
    }
  }) as RequestHandler,

  getEmployeeDetail: (async (req, res, next) => {
    try {
      const data = await workforceService.getEmployeeDetail(getParam(req.params.id), {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
      })
      return sendSuccess(res, data)
    } catch (err) {
      next(err)
    }
  }) as RequestHandler,

  createEmployee: (async (req, res, next) => {
    try {
      const data = await workforceService.createEmployee(req.body, req.user?.id)
      return sendCreated(res, data)
    } catch (err) {
      next(err)
    }
  }) as RequestHandler,

  updateEmployee: (async (req, res, next) => {
    try {
      const data = await workforceService.updateEmployee(getParam(req.params.id), req.body, req.user?.id)
      return sendSuccess(res, data)
    } catch (err) {
      next(err)
    }
  }) as RequestHandler,
}
