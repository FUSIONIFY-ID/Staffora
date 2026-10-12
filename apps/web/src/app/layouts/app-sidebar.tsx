import React from 'react'
import { Link, NavLink } from 'react-router'
import type { Role } from '../providers/auth-provider.js'
import { visibleNavGroups } from '../navigation/nav-config.js'

export interface AppSidebarProps {
  role: Role
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ role }) => {
  const groups = visibleNavGroups(role)

  return (
    <aside className="hidden md:flex w-60 xl:w-64 shrink-0 flex-col sticky top-0 h-screen border-r border-slate-800/80 bg-slate-900/70">
      <div className="h-16 flex items-center px-5 border-b border-slate-800/80">
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src="/logo.png"
            alt="Staffora"
            className="h-7 w-auto object-contain transition-transform group-hover:scale-105"
            onError={(e) => {
              // Fallback to text if the logo is not reachable in dev
              const target = e.currentTarget
              target.style.display = 'none'
              const parent = target.parentElement
              if (parent && !parent.querySelector('.brand-fallback')) {
                const span = document.createElement('span')
                span.className = 'brand-fallback text-lg font-extrabold text-blue-500'
                span.innerText = '◆ Staffora'
                parent.appendChild(span)
              }
            }}
          />
        </Link>
      </div>

      <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        {groups.map((group) => (
          <div key={group.label} role="group" aria-label={group.label} className="space-y-1">
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {group.label}
            </p>
            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}
