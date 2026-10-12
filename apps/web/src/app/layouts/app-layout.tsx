import React from 'react'
import { Link, Outlet, useNavigate } from 'react-router'
import { useAuth } from '../providers/auth-provider.js'
import { Button } from '../../components/ui/button.js'
import { ErrorBoundary } from '../../components/error-boundary.js'
import { AppSidebar } from './app-sidebar.js'
import { AppHeader } from './app-header.js'
import { AppUserMenu } from './app-user-menu.js'

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {user && <AppSidebar role={user.role} />}

      <div className="flex-1 min-w-0 flex flex-col">
        <AppHeader
          actions={
            user ? (
              <AppUserMenu user={user} onSignOut={handleLogout} />
            ) : (
              <Link to="/login">
                <Button size="sm">Sign in</Button>
              </Link>
            )
          }
        />

        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>

        <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
          Staffora MVP v1.0 &middot; Project Resource Allocation & Workforce Planning System
        </footer>
      </div>
    </div>
  )
}
