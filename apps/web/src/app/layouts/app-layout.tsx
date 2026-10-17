import React from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { useAuth } from '../providers/auth-provider.js'
import { Badge } from '../../components/ui/badge.js'
import { Button } from '../../components/ui/button.js'

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  // Navigation filtering per PRD 2.2 Permission Matrix
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', roles: ['ADMIN', 'PROJECT_MANAGER', 'RESOURCE_MANAGER'] },
    { label: 'Resources', path: '/resources', roles: ['ADMIN', 'PROJECT_MANAGER', 'RESOURCE_MANAGER'] },
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
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <img
                src="/logo.png"
                alt="Staffora"
                className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
                onError={(e) => {
                  // Fallback to text if image not accessible in dev
                  const target = e.currentTarget
                  target.style.display = 'none'
                  const parent = target.parentElement
                  if (parent && !parent.querySelector('.brand-fallback')) {
                    const span = document.createElement('span')
                    span.className = 'brand-fallback text-xl font-extrabold text-blue-500'
                    span.innerText = '◆ Staffora'
                    parent.appendChild(span)
                  }
                }}
              />
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
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
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-slate-200">
                    {user.employee?.fullName || user.email}
                  </div>
                  <div className="flex items-center justify-end gap-1.5 mt-0.5">
                    <Badge variant={roleBadgeVariant}>{user.role.replace('_', ' ')}</Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout}>
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
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        Staffora MVP v1.0 &middot; Project Resource Allocation & Workforce Planning System
      </footer>
    </div>
  )
}
