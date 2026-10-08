import React from 'react'
import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../providers/auth-provider.js'
import { LoadingState } from '../../components/feedback/loading-state.js'

export interface PublicRouteProps {
  children?: React.ReactNode
  redirectTo?: string
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children, redirectTo }) => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingState message="Loading..." fullScreen />
  }

  if (user) {
    const target = redirectTo || (user.role === 'EMPLOYEE' ? '/my-profile' : '/dashboard')
    return <Navigate to={target} replace />
  }

  return children ? <>{children}</> : <Outlet />
}
