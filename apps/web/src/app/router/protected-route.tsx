import React from 'react'
import { Navigate, Outlet } from 'react-router'
import { useAuth, type Role } from '../providers/auth-provider.js'
import { Spinner } from '../../components/ui/spinner.js'
import { Alert } from '../../components/ui/alert.js'
import { Link } from 'react-router'

interface ProtectedRouteProps {
  allowedRoles?: Role[]
  children?: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-slate-400">Verifying session credentials...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6">
        <Alert type="error" className="mb-6">
          <div className="font-bold text-base mb-1">403 - Forbidden Access</div>
          <p className="text-sm leading-relaxed">
            Your role (<span className="font-semibold">{user.role}</span>) does not have authorization
            to view or operate this capability. Direct URL navigation to unauthorized endpoints is restricted
            per Staffora Security Baseline.
          </p>
        </Alert>
        <div className="flex justify-center">
          <Link
            to={user.role === 'EMPLOYEE' ? '/my-profile' : '/dashboard'}
            className="text-sm font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-4"
          >
            &larr; Return to accessible home
          </Link>
        </div>
      </div>
    )
  }

  return children ? <>{children}</> : <Outlet />
}
