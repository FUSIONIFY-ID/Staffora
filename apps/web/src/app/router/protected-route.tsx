import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../providers/auth-provider.js'
import { LoadingState } from '../../components/feedback/loading-state.js'
import { ForbiddenState } from '../../components/feedback/forbidden-state.js'
import { canAccess } from '../../lib/rbac.js'
import type { Role } from '../../constants/roles.js'
import type { LoginRedirectState } from './redirect.js'

export interface ProtectedRouteProps {
  allowedRoles?: Role[]
  children?: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <LoadingState message="Verifying session credentials..." fullScreen />
  }

  if (!user) {
    const state: LoginRedirectState = { from: `${location.pathname}${location.search}` }
    return <Navigate to="/login" replace state={state} />
  }

  if (allowedRoles && allowedRoles.length > 0 && !canAccess(user, allowedRoles)) {
    return <ForbiddenState userRole={user.role} />
  }

  return children ? <>{children}</> : <Outlet />
}
