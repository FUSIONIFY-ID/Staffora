import type { Request, Response, NextFunction } from 'express'
import { sendCreated, sendList, sendSuccess } from '../../common/http/response.js'
import { ForbiddenError, NotFoundError } from '../../common/errors/app-error.js'
import { workforceService } from './workforce.service.js'

export const workforceController = {
  async getDepartments(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await workforceService.getDepartments()
      sendSuccess(res, items)
    } catch (err) {
      next(err)
    }
  },

  async createDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await workforceService.createDepartment(req.body, req.user?.id)
      sendCreated(res, item)
    } catch (err) {
      next(err)
    }
  },

  async getJobRoles(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await workforceService.getJobRoles()
      sendSuccess(res, items)
    } catch (err) {
      next(err)
    }
  },

  async createJobRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await workforceService.createJobRole(req.body, req.user?.id)
      sendCreated(res, item)
    } catch (err) {
      next(err)
    }
  },

  async getEmployees(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await workforceService.getEmployees(req.query)
      sendList(res, result.data, {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
      })
    } catch (err) {
      next(err)
    }
  },

  async createEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await workforceService.createEmployee(req.body, req.user?.id)
      sendCreated(res, item)
    } catch (err) {
      next(err)
    }
  },

  async getEmployeeDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await workforceService.getEmployeeDetail(req.params.id as string)
      if (!item) {
        throw new NotFoundError('Employee profile was not found.')
      }

      if (req.user?.role === 'EMPLOYEE' && req.user.employeeId !== item.id) {
        throw new ForbiddenError('You may only view your own employee profile.')
      }

      sendSuccess(res, item)
    } catch (err) {
      next(err)
    }
  },

  async updateEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await workforceService.updateEmployee(req.params.id as string, req.body, req.user?.id)
      sendSuccess(res, item)
    } catch (err) {
      next(err)
    }
  },
}
