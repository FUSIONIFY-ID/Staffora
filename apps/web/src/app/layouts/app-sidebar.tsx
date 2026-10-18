import React from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import type { UserProfile } from '../providers/auth-provider.js'

export interface AppSidebarProps {
  user: UserProfile | null
  onLogout: () => Promise<void>
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ user, onLogout }): React.JSX.Element => {
  const location = useLocation()
  const role = user?.role || 'EMPLOYEE'
  const isEmployee = role === 'EMPLOYEE'
  const isAdmin = role === 'ADMIN'
  const isManager = role === 'ADMIN' || role === 'PROJECT_MANAGER' || role === 'RESOURCE_MANAGER'
  const isResourceSection = location.pathname.startsWith('/resources')

  const showMyProfile = isEmployee || isResourceSection
  const showUsers = isAdmin || isResourceSection

  const userFullName = user?.employee?.fullName || (user?.email ? user.email.split('@')[0] : 'Arya Isnaidi')
  const userInitials =
    userFullName
      .split(' ')
      .filter(Boolean)
      .map((s) => s[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'AI'
  const userRoleLabel =
    role === 'ADMIN'
      ? 'Admin'
      : role === 'PROJECT_MANAGER'
      ? 'Project Manager'
      : role === 'RESOURCE_MANAGER'
      ? 'Resource Manager'
      : 'Employee'

  return (
    <aside className="hidden lg:flex lg:flex-col w-60 bg-white border-r border-slate-200/90 shrink-0 select-none">
      {/* Brand / Logo */}
      <div className="p-6 pb-5">
        <Link to={isEmployee ? '/my-profile' : '/dashboard'} className="block group">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
            Staffora
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Right People. Right Project.</p>
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 space-y-5 overflow-y-auto">
        {/* Overview / Dashboard */}
        {!isEmployee && (
          <div>
            <NavLink
              to="/dashboard"
              aria-label="Dashboard"
              className={({ isActive }) =>
                `flex items-center px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <span className="sr-only">Dashboard</span>
              Overview
            </NavLink>
          </div>
        )}

        {/* Section: WORKFORCE */}
        {isManager && (
          <div className="space-y-0.5">
            <span className="block px-3.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Workforce
            </span>
            <NavLink
              to="/resources"
              className={({ isActive }) =>
                `flex items-center px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              Resources
            </NavLink>
            <NavLink
              to="/skills"
              className={({ isActive }) =>
                `flex items-center px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              Skills
            </NavLink>
            <NavLink
              to="/capacity"
              className={({ isActive }) =>
                `flex items-center px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              Capacity
            </NavLink>
          </div>
        )}

        {/* Section: PROJECTS */}
        <div className="space-y-0.5">
          <span className="block px-3.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Projects
          </span>
          <NavLink
            to="/projects"
            className={({ isActive }) =>
              `flex items-center px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`
            }
          >
            Projects
          </NavLink>
          {isManager && (
            <NavLink
              to="/allocations"
              className={({ isActive }) =>
                `flex items-center px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              Allocations
            </NavLink>
          )}
        </div>

        {/* Section: MY WORKSPACE */}
        {showMyProfile && (
          <div className="space-y-0.5">
            <span className="block px-3.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              My Workspace
            </span>
            <NavLink
              to="/my-profile"
              className={({ isActive }) =>
                `flex items-center px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              My Profile
            </NavLink>
          </div>
        )}

        {/* Section: ADMINISTRATION */}
        {showUsers && (
          <div className="space-y-0.5">
            <span className="block px-3.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Administration
            </span>
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                `flex items-center px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              Users
            </NavLink>
          </div>
        )}
      </nav>

      {/* Bottom Profile Pill */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-100 p-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-600 font-semibold text-xs flex items-center justify-center shrink-0">
              {userInitials}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-800 truncate">{userFullName}</div>
              <div className="text-[11px] text-slate-400 truncate">{userRoleLabel}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors text-xs cursor-pointer"
            aria-label="Sign out"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
