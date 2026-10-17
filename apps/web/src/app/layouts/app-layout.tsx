import React, { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { useAuth } from '../providers/auth-provider.js'
import { Badge } from '../../components/ui/badge.js'
import { Button } from '../../components/ui/button.js'

export const AppLayout: React.FC = (): React.JSX.Element => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async (): Promise<void> => {
    await logout()
    navigate('/login')
  }

  // Navigation filtering per PRD 2.2 Permission Matrix
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', roles: ['ADMIN', 'PROJECT_MANAGER', 'RESOURCE_MANAGER'] },
    { label: 'Resources', path: '/resources', roles: ['ADMIN', 'PROJECT_MANAGER', 'RESOURCE_MANAGER'] },
    { label: 'Find Resources', path: '/resource-finder', roles: ['ADMIN', 'PROJECT_MANAGER', 'RESOURCE_MANAGER'] },
    { label: 'Skills', path: '/skills', roles: ['ADMIN', 'PROJECT_MANAGER', 'RESOURCE_MANAGER'] },
    { label: 'Capacity', path: '/capacity', roles: ['ADMIN', 'PROJECT_MANAGER', 'RESOURCE_MANAGER'] },
    { label: 'Projects', path: '/projects', roles: ['ADMIN', 'PROJECT_MANAGER', 'RESOURCE_MANAGER', 'EMPLOYEE'] },
    { label: 'Allocations', path: '/allocations', roles: ['ADMIN', 'PROJECT_MANAGER', 'RESOURCE_MANAGER'] },
    { label: 'My Profile', path: '/my-profile', roles: ['EMPLOYEE'] },
    { label: 'Users', path: '/admin/users', roles: ['ADMIN'] },
  ].filter((item) => user && item.roles.includes(user.role))

  const roleBadgeVariant = {
    ADMIN: 'purple',
    PROJECT_MANAGER: 'blue',
    RESOURCE_MANAGER: 'amber',
    EMPLOYEE: 'green',
  }[user?.role || 'EMPLOYEE'] as 'purple' | 'blue' | 'amber' | 'green'

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-3 sm:gap-6">
            {/* Hamburger Button for Mobile & Tablet (< 1280px) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="xl:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              aria-label={isMobileMenuOpen ? 'Tutup Menu' : 'Buka Menu'}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            <Link to="/dashboard" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
              <img
                src="/logo-icon.png"
                alt="Staffora Emblem"
                className="h-8 w-8 object-contain transition-transform group-hover:scale-105"
              />
              <span className="text-xl font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors">
                Staffora
              </span>
            </Link>

            {/* Desktop Navbar (>= 1280px) */}
            <nav className="hidden xl:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-600/15 text-blue-400 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-slate-200 max-w-[140px] sm:max-w-[180px] lg:max-w-[220px] truncate">
                    {user.employee?.fullName || user.email}
                  </div>
                  <div className="flex items-center justify-end gap-1.5 mt-0.5">
                    <Badge variant={roleBadgeVariant}>{user.role.replace('_', ' ')}</Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout} className="whitespace-nowrap shrink-0">
                  Sign out
                </Button>
              </div>
            ) : (
              <Link to="/login">
                <Button size="sm">Sign in</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile & Tablet Navigation Drawer (< 1280px) */}
        {isMobileMenuOpen && (
          <div className="xl:hidden border-t border-slate-800 bg-slate-900/95 px-4 pt-3 pb-4 space-y-1 backdrop-blur-xl animate-fadeIn shadow-2xl">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-300 font-semibold border-l-2 border-blue-500'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            {user && (
              <div className="pt-3 mt-2 border-t border-slate-800/80 px-2 sm:hidden flex items-center justify-between text-xs text-slate-400">
                <span className="truncate max-w-[180px]">{user.employee?.fullName || user.email}</span>
                <Badge variant={roleBadgeVariant}>{user.role.replace('_', ' ')}</Badge>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        Staffora MVP v1.0 &middot; Project Resource Allocation & Workforce Planning System
      </footer>
    </div>
  )
}

