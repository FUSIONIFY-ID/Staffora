import React from "react";
import { Routes, Route, Navigate } from "react-router";
import { AppLayout } from "../layouts/app-layout.js";
import { ProtectedRoute } from "./protected-route.js";
import { PublicRoute } from "./public-route.js";
import { useAuth } from "../providers/auth-provider.js";
import { LoadingState } from "../../components/loading-state.js";
import { NotFoundView } from "../layouts/not-found-view.js";
import {
  ADMIN_ROLES,
  EMPLOYEE_ROLES,
  MANAGEMENT_ROLES,
  PROJECT_ROLES,
  homePathForRole,
} from "../navigation/nav-config.js";

// Feature Pages
import { LoginPage } from "../../features/auth/login-page.js";
import { DashboardPage } from "../../features/dashboard/dashboard-page.js";
import { ResourcesPage } from "../../features/resources/resources-page.js";
import { ResourceDetailPage } from "../../features/resources/resource-detail-page.js";
import { SkillsPage } from "../../features/skills/skills-page.js";
import { CapacityPage } from "../../features/capacity/capacity-page.js";
import { ProjectsPage } from "../../features/projects/projects-page.js";
import { ProjectDetailPage } from "../../features/projects/project-detail-page.js";
import { AllocationsPage } from "../../features/allocations/allocations-page.js";
import { MyProfilePage } from "../../features/my-profile/my-profile-page.js";
import { UsersPage } from "../../features/admin/users-page.js";

const RootRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState fullHeight message="Loading Staffora..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={homePathForRole(user.role)} replace />;
};

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Protected Application Routes inside AppLayout */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={MANAGEMENT_ROLES}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Resources */}
        <Route
          path="/resources"
          element={
            <ProtectedRoute allowedRoles={MANAGEMENT_ROLES}>
              <ResourcesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resources/:employeeId"
          element={
            <ProtectedRoute allowedRoles={MANAGEMENT_ROLES}>
              <ResourceDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Skills */}
        <Route
          path="/skills"
          element={
            <ProtectedRoute allowedRoles={MANAGEMENT_ROLES}>
              <SkillsPage />
            </ProtectedRoute>
          }
        />

        {/* Capacity */}
        <Route
          path="/capacity"
          element={
            <ProtectedRoute allowedRoles={MANAGEMENT_ROLES}>
              <CapacityPage />
            </ProtectedRoute>
          }
        />

        {/* Projects */}
        <Route
          path="/projects"
          element={
            <ProtectedRoute allowedRoles={PROJECT_ROLES}>
              <ProjectsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId"
          element={
            <ProtectedRoute allowedRoles={PROJECT_ROLES}>
              <ProjectDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId/staffing"
          element={
            <ProtectedRoute allowedRoles={PROJECT_ROLES}>
              <ProjectDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId/resources"
          element={
            <ProtectedRoute allowedRoles={PROJECT_ROLES}>
              <ProjectDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Allocations */}
        <Route
          path="/allocations"
          element={
            <ProtectedRoute allowedRoles={MANAGEMENT_ROLES}>
              <AllocationsPage />
            </ProtectedRoute>
          }
        />

        {/* My Profile */}
        <Route
          path="/my-profile"
          element={
            <ProtectedRoute allowedRoles={EMPLOYEE_ROLES}>
              <MyProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Admin User Management */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={ADMIN_ROLES}>
              <UsersPage />
            </ProtectedRoute>
          }
        />

        {/* Unmatched paths inside the shell */}
        <Route path="*" element={<NotFoundView />} />
      </Route>
    </Routes>
  );
};
