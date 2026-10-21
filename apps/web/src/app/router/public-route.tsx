import React from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../providers/auth-provider.js";
import { LoadingState } from "../../components/loading-state.js";
import { homePathForRole } from "../navigation/nav-config.js";
import { readRedirectFrom } from "./redirect.js";

export interface PublicRouteProps {
  children?: React.ReactNode;
}

/**
 * Guest-only route for /login. A signed-in user goes back to the page they asked for,
 * or to their role's home page. The destination is read from router state here, not
 * only in the login form, so a freshly signed-in user is not sent to the home page
 * first.
 */
export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingState fullHeight message="Loading..." />;
  }

  if (user) {
    const target = readRedirectFrom(location.state) ?? homePathForRole(user.role);
    return <Navigate to={target} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
