import React, { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../providers/auth-provider.js'
import { AppSidebar } from './app-sidebar.js'

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
  const userInitials =
    userFullName
      .split(' ')
      .filter(Boolean)
      .map((s) => s[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'AI'

  return (
    <div className="min-h-screen flex bg-[#F8F9FA] text-slate-800 font-sans antialiased">
      {/* Left Sidebar */}
      <AppSidebar user={user} onLogout={handleLogout} />

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
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
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
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 font-medium cursor-pointer"
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
            <NavLink
              to="/my-profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              My Profile
            </NavLink>
            <NavLink
              to="/admin/users"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Users
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
