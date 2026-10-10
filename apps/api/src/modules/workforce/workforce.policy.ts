import type { AuthenticatedUser } from '../../common/auth/types.js'
import {
  canAccessEmployeeProfile,
  assertCanAccessEmployeeProfile,
} from '../../common/auth/policy.js'

export const workforcePolicy = {
  canViewEmployee(user: AuthenticatedUser, employeeId: string): boolean {
    return canAccessEmployeeProfile(user, employeeId)
  },

  canManageEmployee(user: AuthenticatedUser): boolean {
    return user.role === 'ADMIN' || user.role === 'RESOURCE_MANAGER'
  },

  assertCanViewEmployee(
    user: AuthenticatedUser,
    employeeId: string,
    message = 'Employee not found.',
  ): void {
    assertCanAccessEmployeeProfile(user, employeeId, message)
  },
}
