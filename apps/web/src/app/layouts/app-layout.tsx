import React, { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../providers/auth-provider.js'

export const AppLayout: React.FC = (): React.JSX.Element => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const handleLogout = async (): Promise<void> => {
    await logout()
    navigate('/login')
  }

  const role = user?.role || 'EMPLOYEE'
  const isEmployee = role === 'EMPLOYEE'
  const isAdmin = role === 'ADMIN'
  const isManager = role === 'ADMIN' || role === 'PROJECT_MANAGER' || role === 'RESOURCE_MANAGER'

  // Breadcrumb derivation matching Figma
  const getBreadcrumb = (): string => {
    const p = location.pathname
    if (p.startsWith('/resources/')) return 'Workforce / Resources / Detail'
    if (p.startsWith('/resources')) return 'Workforce / Resources'
    if (p.startsWith('/skills')) return 'Workforce / Skills'
    if (p.startsWith('/capacity')) return 'Workforce / Capacity'
    if (p.startsWith('/resource-finder')) return 'Workforce / Find Resources'
    if (p.startsWith('/projects')) return 'Projects / All Projects'
    if (p.startsWith('/allocations')) return 'Projects / Allocations'
    if (p.startsWith('/my-profile')) return 'My Workspace / My Profile'
    if (p.startsWith('/admin/users')) return 'Administration / Users'
    return 'Overview'
  }

  const userFullName = user?.employee?.fullName || (user?.email ? user.email.split('@')[0] : 'Arya Isnaidi')
  const userInitials = userFullName
    .split(' ')
    .filter(Boolean)
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'AI'
  const userRoleLabel = role === 'ADMIN' ? 'Admin' : role === 'PROJECT_MANAGER' ? 'Project Manager' : role === 'RESOURCE_MANAGER' ? 'Resource Manager' : 'Employee'

  return (
    <div className="min-h-screen flex bg-[#F8F9FA] text-slate-800 font-sans antialiased">
      {/* Desktop Sidebar (Left) */}
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
          {isEmployee && (
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
          {isAdmin && (
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
              onClick={handleLogout}
              title="Sign out"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors text-xs"
              aria-label="Sign out"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar matching Figma */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur border-b border-slate-200/80 px-6 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Breadcrumb matching Figma */}
            <nav aria-label="Top Breadcrumb" className="text-xs sm:text-sm font-medium text-slate-400 select-none">
              {getBreadcrumb()}
            </nav>
          </div>

          {/* Right side search + profile */}
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search people, projects..."
                className="w-56 rounded-lg bg-slate-50 border border-slate-200/80 pl-8 pr-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Hexagon / Setting icon */}
            <button
              type="button"
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
              aria-label="Notifications"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polygon points="12 2 19 6 19 18 12 22 5 18 5 6 12 2" />
              </svg>
            </button>

            {/* User Avatar dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-600 text-xs font-semibold flex items-center justify-center">
                  {userInitials}
                </div>
                <span className="text-xs font-semibold text-slate-700 hidden sm:inline">{userFullName.split(' ')[0]}</span>
                <span className="text-[10px] text-slate-400">▼</span>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white border border-slate-200 shadow-xl py-1 z-50 text-xs">
                  <div className="px-4 py-2 border-b border-slate-100 text-slate-500">
                    <p className="font-semibold text-slate-800">{userFullName}</p>
                    <p className="text-[11px] text-slate-400">{user?.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 font-medium"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-1">
            <NavLink
              to="/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Overview
            </NavLink>
            <NavLink
              to="/resources"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Resources
            </NavLink>
            <NavLink
              to="/projects"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Projects
            </NavLink>
          </div>
        )}

        {/* Main Routed Content */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
