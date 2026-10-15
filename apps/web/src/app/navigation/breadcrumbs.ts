import { NAV_GROUPS, PRIMARY_NAV, type NavItem } from './nav-config.js'

export interface Crumb {
  label: string
  to?: string
}

/**
 * Builds the crumb trail for a nav entry.
 *
 * `groupLabel` is absent for an entry that sits directly under the brand block
 * in the sidebar (PRIMARY_NAV), which is rendered as a single crumb.
 */
function crumbsFor(groupLabel: string | undefined, item: NavItem, pathname: string): Crumb[] {
  const crumbs: Crumb[] = []
  if (groupLabel !== undefined && groupLabel !== item.label) {
    crumbs.push({ label: groupLabel })
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

function matches(item: NavItem, pathname: string): boolean {
  return pathname === item.path || pathname.startsWith(`${item.path}/`)
}

export function buildBreadcrumbs(pathname: string): Crumb[] {
  // PRIMARY_NAV is searched first: Overview renders above the groups in the
  // sidebar, so a pathname that matches it would otherwise fall through to the
  // groups and come back empty, leaving the header without a crumb trail.
  for (const item of PRIMARY_NAV) {
    if (matches(item, pathname)) {
      return crumbsFor(undefined, item, pathname)
    }
  }

  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (matches(item, pathname)) {
        return crumbsFor(group.label, item, pathname)
      }
    }
  }
  return []
}
