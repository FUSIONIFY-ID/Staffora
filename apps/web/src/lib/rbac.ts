import type { Role } from '../constants/roles.js'
import type { UserProfile } from '../types/auth.js'

/**
 * Checks if a user has a specific role.
 */
export function hasRole(user: UserProfile | null | undefined, role: Role): boolean {
  if (!user || !user.isActive) return false
  return user.role === role
}

/**
 * Checks if a user has at least one of the specified allowed roles.
 */
export function hasAnyRole(
  user: UserProfile | null | undefined,
  allowedRoles: Role[] | readonly Role[],
): boolean {
  if (!user || !user.isActive) return false
  return allowedRoles.includes(user.role)
}

/**
 * Checks if a user can access a route or action.
 * If allowedRoles is not specified or empty, any authenticated active user can access.
 */
export function canAccess(
  user: UserProfile | null | undefined,
  allowedRoles?: Role[] | readonly Role[],
): boolean {
  if (!user || !user.isActive) return false
  if (!allowedRoles || allowedRoles.length === 0) return true
  return allowedRoles.includes(user.role)
}
