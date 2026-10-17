import { useAuth } from '../app/providers/auth-provider.js'
import { hasRole, hasAnyRole, canAccess } from '../lib/rbac.js'
import type { Role } from '../constants/roles.js'

export function useRbac() {
  const { user } = useAuth()

  return {
    user,
    hasRole: (role: Role) => hasRole(user, role),
    hasAnyRole: (roles: Role[] | readonly Role[]) => hasAnyRole(user, roles),
    canAccess: (allowedRoles?: Role[] | readonly Role[]) => canAccess(user, allowedRoles),
  }
}
