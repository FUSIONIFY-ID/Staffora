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
    // PRD §2.2 grants self-view only in the Employee column ("View Own"), and
    // US06.02 AC01.01 says "Employee can access My Profile". BR-G02 guarantees an
    // employee profile only for Project Manager, Resource Manager, and Employee —
    // Admin is not covered, so the page has nothing it can rely on for an Admin.
    // Design frame 02 draws one identical chrome in every frame — frame 18 shows
    // the full menu beside "Current role: Employee" — so it cannot be read as a
    // per-role visibility grant.
    items: [{ label: 'My Profile', path: '/my-profile', roles: EMPLOYEE_ROLES }],
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
