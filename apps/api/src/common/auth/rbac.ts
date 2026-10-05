import type { RequestHandler } from 'express'
import { UnauthorizedError, ForbiddenError } from '../errors/app-error.js'
import type { Role, AuthenticatedUser } from './types.js'

export function requireAuth(): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required to access this resource.'))
    }
    next()
  }
}

export function requireRole(...allowedRoles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required.'))
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to perform this action.'))
    }
    next()
  }
}

export function canManageProject(user: AuthenticatedUser, projectManagerEmployeeId: string): boolean {
  if (user.role === 'ADMIN') return true
  if (user.role === 'PROJECT_MANAGER' && user.employeeId === projectManagerEmployeeId) return true
  return false
}

export function canManageAllocation(user: AuthenticatedUser, projectManagerEmployeeId: string): boolean {
  if (user.role === 'ADMIN' || user.role === 'RESOURCE_MANAGER') return true
  if (user.role === 'PROJECT_MANAGER' && user.employeeId === projectManagerEmployeeId) return true
  return false
}
