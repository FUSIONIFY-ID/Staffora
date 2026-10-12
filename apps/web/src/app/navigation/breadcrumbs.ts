import { NAV_GROUPS, type NavGroup, type NavItem } from './nav-config.js'

export interface Crumb {
  label: string
  to?: string
}

function crumbsFor(group: NavGroup, item: NavItem, pathname: string): Crumb[] {
  const crumbs: Crumb[] = []
  if (group.label !== item.label) {
    crumbs.push({ label: group.label })
  }
  crumbs.push({ label: item.label, to: item.path })

  const rest = pathname
    .slice(item.path.length)
    .split('/')
    .filter((segment) => segment.length > 0)
  rest.forEach((segment, index) => {
    crumbs.push({
      label: segment,
      to: `${item.path}/${rest.slice(0, index + 1).join('/')}`,
    })
  })

  // The final crumb is the current page and is not a link.
  const last = crumbs.length - 1
  return crumbs.map((crumb, index) => (index === last ? { label: crumb.label } : crumb))
}

export function buildBreadcrumbs(pathname: string): Crumb[] {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (pathname === item.path || pathname.startsWith(`${item.path}/`)) {
        return crumbsFor(group, item, pathname)
      }
    }
  }
  return []
}
