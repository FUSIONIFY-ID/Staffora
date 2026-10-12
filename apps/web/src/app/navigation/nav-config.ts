import type { Role } from '../providers/auth-provider.js'

// Shared role sets. The router guards and the sidebar both read these, so a menu entry is
// shown exactly when its route is reachable. Exception: /my-profile keeps ALL_ROLES because
// that guard predates this card; the menu still lists My Profile for EMPLOYEE only, per the
// PRD 2.2 permission matrix. Reconciling the two is a separate authorization decision.
export const MANAGEMENT_ROLES: readonly Role[] = ['ADMIN', 'PROJECT_MANAGER', 'RESOURCE_MANAGER']
export const PROJECT_ROLES: readonly Role[] = [...MANAGEMENT_ROLES, 'EMPLOYEE']
export const EMPLOYEE_ROLES: readonly Role[] = ['EMPLOYEE']
export const ADMIN_ROLES: readonly Role[] = ['ADMIN']
export const ALL_ROLES: readonly Role[] = [...MANAGEMENT_ROLES, 'EMPLOYEE']

export interface NavItem {
  label: string
  path: string
  roles: readonly Role[]
}

export interface NavGroup {
  label: string
  items: readonly NavItem[]
}

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', path: '/dashboard', roles: MANAGEMENT_ROLES }],
  },
  {
    label: 'Workforce',
    items: [
      { label: 'Resources', path: '/resources', roles: MANAGEMENT_ROLES },
      { label: 'Skills', path: '/skills', roles: MANAGEMENT_ROLES },
      { label: 'Capacity', path: '/capacity', roles: MANAGEMENT_ROLES },
    ],
  },
  {
    label: 'Projects',
    items: [
      { label: 'Projects', path: '/projects', roles: PROJECT_ROLES },
      { label: 'Allocations', path: '/allocations', roles: MANAGEMENT_ROLES },
    ],
  },
  {
    label: 'My Workspace',
    items: [{ label: 'My Profile', path: '/my-profile', roles: EMPLOYEE_ROLES }],
  },
  {
    label: 'Administration',
    items: [{ label: 'Users', path: '/admin/users', roles: ADMIN_ROLES }],
  },
]

export function visibleNavGroups(role: Role): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    label: group.label,
    items: group.items.filter((item) => item.roles.includes(role)),
  })).filter((group) => group.items.length > 0)
}

export function homePathForRole(role: Role): string {
  return role === 'EMPLOYEE' ? '/my-profile' : '/dashboard'
}
