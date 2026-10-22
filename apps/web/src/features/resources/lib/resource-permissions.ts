import type { Role } from '../../../app/providers/auth-provider.js'

/**
 * Roles that may create or edit employee records.
 *
 * Mirrors the backend route guards exactly (workforce.routes.ts):
 *   POST   /employees  -> requireRole('ADMIN', 'RESOURCE_MANAGER')
 *   PATCH  /employees/:id -> requireRole('ADMIN', 'RESOURCE_MANAGER')
 *
 * The UI hides the controls for other roles, but this is presentation only:
 * authorization is still enforced server-side, so a hidden button is never the
 * security boundary (TSD 15.4).
 */
export const RESOURCE_WRITE_ROLES: readonly Role[] = ['ADMIN', 'RESOURCE_MANAGER']

/** True when the role may create and edit employee records. */
export function canManageResources(role: Role | undefined): boolean {
  if (!role) return false
  return RESOURCE_WRITE_ROLES.includes(role)
}
