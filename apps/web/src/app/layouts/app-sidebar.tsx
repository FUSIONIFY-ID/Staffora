import React from 'react'
import { NavLink } from 'react-router'
import type { UserProfile } from '../providers/auth-provider.js'
import { visibleNavGroups, visiblePrimaryNav } from '../navigation/nav-config.js'

export interface AppSidebarProps {
  user: UserProfile
}

const linkClass = ({ isActive }: { isActive: boolean }): string =>
  `flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
    isActive
      ? 'bg-info-surface text-info-text font-semibold'
      : 'text-ink-muted font-medium hover:text-ink hover:bg-surface-chip'
  }`

const GROUP_HEADING = 'px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-ink-dim'

/**
 * Sidebar, per design frame 02.
 *
 * The brand block is the text wordmark and tagline, which is what the design
 * uses: the file contains no image node at all. A raster logo was used here
 * before and its opaque canvas rendered as a white box on the dark login panel.
 *
 * The signed-in user sits in a block at the foot of the sidebar, as in the
 * design, in addition to the header menu.
 */
export const AppSidebar: React.FC<AppSidebarProps> = ({ user }) => {
  const primary = visiblePrimaryNav(user.role)
  const groups = visibleNavGroups(user.role)
  const displayName = user.employee?.fullName || user.email

  return (
    <aside className="hidden md:flex w-[240px] shrink-0 flex-col sticky top-0 h-screen border-r border-line bg-surface-white">
      <div className="h-[72px] shrink-0 flex flex-col justify-center px-5 border-b border-line">
        <span className="text-2xl font-semibold leading-tight text-ink">Staffora</span>
        <span className="text-[11px] leading-4 text-ink-dim">Right People. Right Project.</span>
      </div>

      <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        <div className="space-y-1">
          {primary.map((item) => (
            <NavLink key={item.path} to={item.path} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
        </div>

        {groups.map((group) => (
          <div key={group.label} role="group" aria-label={group.label} className="space-y-1">
            <p className={GROUP_HEADING}>{group.label}</p>
            {group.items.map((item) => (
              <NavLink key={item.path} to={item.path} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-[10px] border border-line px-3 py-2">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-info-surface text-xs font-semibold text-info-text"
          >
            {displayName.slice(0, 2).toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold leading-[19px] text-ink-soft">
              {displayName}
            </span>
            <span className="block truncate text-[11px] leading-4 text-ink-dim">{user.email}</span>
          </span>
        </div>
      </div>
    </aside>
  )
}
