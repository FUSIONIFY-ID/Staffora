import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../providers/auth-provider.js'
import { LoadingState } from '../../components/feedback/loading-state.js'
import { getHomePath, readRedirectFrom } from './redirect.js'

export interface PublicRouteProps {
  children?: React.ReactNode
  redirectTo?: string
}

/**
 * Guest-only route. Once a session exists (initial probe or a successful login) the user
 * is sent back to the page they originally requested, or to their role's home page.
 */
export const PublicRoute: React.FC<PublicRouteProps> = ({ children, redirectTo }) => {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <LoadingState message="Loading..." fullScreen />
  }

  if (user) {
    const target = redirectTo ?? readRedirectFrom(location.state) ?? getHomePath(user.role)
    return <Navigate to={target} replace />
  }

  return children ? <>{children}</> : <Outlet />
}
