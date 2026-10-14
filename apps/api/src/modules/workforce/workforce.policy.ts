import { NotFoundError } from '../../common/errors/app-error.js'
import type { AuthenticatedUser } from '../../common/auth/types.js'

/**
 * Employee-scope authorization for the workforce module.
 *
 * CODING_STANDARD 3.1 and 3.2 keep authorization out of controllers, so the
 * service calls these helpers before returning a profile.
 *
 * The failure mode is deliberate non-disclosure: an employee requesting a
 * colleague's record gets the same 404 as a record that does not exist. A
 * distinct 403 would confirm that the ID is a real employee, which lets a
 * caller enumerate the workforce.
 *
 * The RBAC foundation in PR #6 introduces a shared `assertPolicyOrNotFound`
 * helper in common/auth. This module keeps its own until that PR merges into
 * dev, at which point the two collapse into the shared helper; see the PR #10
 * review thread for the recorded decision. Nothing in this file is a second
 * convention by accident.
 */
function canViewEmployee(user: AuthenticatedUser, targetEmployeeId: string): boolean {
  if (user.role === 'ADMIN' || user.role === 'RESOURCE_MANAGER' || user.role === 'PROJECT_MANAGER') {
    return true
  }
  if (user.role === 'EMPLOYEE') {
    return Boolean(user.employeeId && user.employeeId === targetEmployeeId)
  }
  return false
}

/**
 * Throws the same NotFoundError for a missing record and for a record the
 * caller may not see, so the two cases are indistinguishable to the client.
 */
function assertCanViewEmployee(
  user: AuthenticatedUser,
  targetEmployeeId: string,
  message = 'Employee profile was not found.',
): void {
  if (!canViewEmployee(user, targetEmployeeId)) {
    throw new NotFoundError(message)
  }
}

export const workforcePolicy = {
  canViewEmployee,
  assertCanViewEmployee,
}
