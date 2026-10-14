import type { Request, Response, NextFunction } from 'express'
import { sendCreated, sendList, sendSuccess } from '../../common/http/response.js'
import { UnauthorizedError } from '../../common/errors/app-error.js'
import { getParam } from '../../common/http/params.js'
import type { AuthenticatedUser } from '../../common/auth/types.js'
import { workforceService } from './workforce.service.js'
import { parseEmployeeDetailQuery, parseEmployeeListQuery } from './workforce.query.js'

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

/**
 * Body and path parameters arrive already parsed by the `validateBody` and
 * `validateParams` middleware on the route. Query strings are the exception
 * while `validateQuery` is unusable (see workforce.query.ts).
 */
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
      const query = parseEmployeeListQuery(req.query)
      const result = await workforceService.getEmployees(query)
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
      const query = parseEmployeeDetailQuery(req.query)
      const item = await workforceService.getEmployeeDetail(
        getParam(req.params.id),
        query,
        requireUser(req),
      )
      sendSuccess(res, item)
    } catch (err) {
      next(err)
    }
  },

  async updateEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await workforceService.updateEmployee(
        getParam(req.params.id),
        req.body,
        requireUser(req).id,
      )
      sendSuccess(res, item)
    } catch (err) {
      next(err)
    }
  },
}
