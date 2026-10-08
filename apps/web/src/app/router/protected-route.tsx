import React from 'react'
import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../providers/auth-provider.js'
import { LoadingState } from '../../components/feedback/loading-state.js'
import { ForbiddenState } from '../../components/feedback/forbidden-state.js'
import { canAccess } from '../../lib/rbac.js'
import type { Role } from '../../constants/roles.js'

export interface ProtectedRouteProps {
  allowedRoles?: Role[]
  children?: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingState message="Verifying session credentials..." fullScreen />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && allowedRoles.length > 0 && !canAccess(user, allowedRoles)) {
    return <ForbiddenState userRole={user.role} />
  }

  return children ? <>{children}</> : <Outlet />
}
