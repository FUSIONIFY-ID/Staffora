import type { Role } from '../../../app/providers/auth-provider.js'

// Mirrors requireRole() on POST/PATCH /employees in workforce.routes.ts.
export const RESOURCE_WRITE_ROLES: readonly Role[] = ['ADMIN', 'RESOURCE_MANAGER']

export function canManageResources(role: Role | undefined): boolean {
  if (!role) return false
  return RESOURCE_WRITE_ROLES.includes(role)
}
