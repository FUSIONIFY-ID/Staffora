import type { Role } from '../providers/auth-provider.js'

/**
 * Shared role sets. The router guards and the sidebar both read these, so a menu
 * entry is shown exactly when its route is reachable. A route and its menu entry
 * must never disagree: if a role cannot open a page, the menu must not offer it,
 * and if the menu offers it, the route must not answer 403.
 */
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

/**
 * Ungrouped entry at the top of the sidebar. Design frame 02 renders Overview as
 * a nav item directly under the brand block, not as a group heading with a
 * separate item beneath it.
 */
export const PRIMARY_NAV: readonly NavItem[] = [
  { label: 'Overview', path: '/dashboard', roles: MANAGEMENT_ROLES },
]

export const NAV_GROUPS: readonly NavGroup[] = [
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
    // Design frame 02 renders the full menu, Administration included, together
    // with My Profile, so the user shown there is an Admin and My Profile is not
    // an Employee-only entry. The route guard has always allowed every role, so
    // ALL_ROLES here makes the menu and the guard agree instead of contradicting
    // each other.
    items: [{ label: 'My Profile', path: '/my-profile', roles: ALL_ROLES }],
  },
  {
    label: 'Administration',
    items: [{ label: 'Users', path: '/admin/users', roles: ADMIN_ROLES }],
  },
]

export function visiblePrimaryNav(role: Role): NavItem[] {
  return PRIMARY_NAV.filter((item) => item.roles.includes(role))
}

export function visibleNavGroups(role: Role): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    label: group.label,
    items: group.items.filter((item) => item.roles.includes(role)),
  })).filter((group) => group.items.length > 0)
}

export function homePathForRole(role: Role): string {
  return role === 'EMPLOYEE' ? '/my-profile' : '/dashboard'
}
