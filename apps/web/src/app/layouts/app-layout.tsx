import React from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../providers/auth-provider.js'
import { ErrorBoundary } from '../../components/error-boundary.js'
import { AppSidebar } from './app-sidebar.js'
import { AppHeader } from './app-header.js'
import { AppUserMenu } from './app-user-menu.js'

/**
 * Application shell.
 *
 * AppLayout is only ever rendered inside ProtectedRoute, which redirects to
 * /login when there is no user, so this component can rely on a user being
 * present. An earlier revision branched on `user` and carried an unreachable
 * "Sign in" link.
 */
export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen flex bg-surface-page text-ink">
      <AppSidebar user={user} />

      <div className="flex-1 min-w-0 flex flex-col">
        <AppHeader actions={<AppUserMenu user={user} onSignOut={handleLogout} />} />

        <main className="flex-1 w-full max-w-[1440px] mx-auto px-9 py-8">
          {/* Keyed on the pathname so a crash on one page does not keep the next
              page stuck on the error state. */}
          <ErrorBoundary key={pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>

        <footer className="border-t border-line py-6 text-center text-xs text-ink-dim">
          Staffora MVP v1.0 &middot; Project Resource Allocation &amp; Workforce Planning System
        </footer>
      </div>
    </div>
  )
}
