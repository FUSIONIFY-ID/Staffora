import type { Request, Response, NextFunction } from 'express'
import { sendCreated, sendList, sendSuccess } from '../../common/http/response.js'
import { UnauthorizedError } from '../../common/errors/app-error.js'
import type { AuthenticatedUser } from '../../common/auth/types.js'
import { workforceService } from './workforce.service.js'

/**
 * `requireAuth()` on every workforce route guarantees an authenticated user.
 * The narrowing lives here so the service can take a non-optional user and
 * keep authorization decisions in workforce.policy.ts.
 */
function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) {
    throw new UnauthorizedError()
  }
  return req.user
}

export const workforceController = {
  async getDepartments(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await workforceService.getDepartments())
    } catch (err) {
      next(err)
    }
  },

  async createDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await workforceService.createDepartment(req.body, requireUser(req).id)
      sendCreated(res, item)
    } catch (err) {
      next(err)
    }
  },

  async getJobRoles(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await workforceService.getJobRoles())
    } catch (err) {
      next(err)
    }
  },

  async createJobRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await workforceService.createJobRole(req.body, requireUser(req).id)
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
      const item = await workforceService.createEmployee(req.body, requireUser(req).id)
      sendCreated(res, item)
    } catch (err) {
      next(err)
    }
  },

  async getEmployeeDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await workforceService.getEmployeeDetail(req.params, req.query, requireUser(req))
      sendSuccess(res, item)
    } catch (err) {
      next(err)
    }
  },

  async updateEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await workforceService.updateEmployee(req.params, req.body, requireUser(req).id)
      sendSuccess(res, item)
    } catch (err) {
      next(err)
    }
  },
}
