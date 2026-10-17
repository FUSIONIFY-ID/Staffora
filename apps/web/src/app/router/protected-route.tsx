import React from "react";
import { Navigate, Outlet } from "react-router";
import { useAuth, type Role } from "../providers/auth-provider.js";
import { homePathForRole } from "../navigation/nav-config.js";
import { LoadingState } from "../../components/loading-state.js";
import { PermissionDenied } from "../../components/permission-denied.js";

interface ProtectedRouteProps {
  allowedRoles?: readonly Role[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  children,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState message="Verifying session credentials..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <PermissionDenied
        role={user.role}
        homePath={homePathForRole(user.role)}
        requiredRoles={allowedRoles}
      />
    );
  }

  return children ? <>{children}</> : <Outlet />;
};
