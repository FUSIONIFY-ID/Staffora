import type { Prisma } from "../../generated/prisma/client.js";
import { ROLES, type AuthenticatedUser } from "../../common/auth/types.js";
import {
  canManageProject,
  canViewProject,
  assertCanManageProject,
  isProjectManagerOwner,
} from "../../common/auth/policy.js";

// Matches no row: projects.id is a UUID and the nil UUID is never issued.
const MATCH_NOTHING: Prisma.ProjectWhereInput = {
  id: "00000000-0000-0000-0000-000000000000",
};

export const projectsPolicy = {
  canCreate(user: AuthenticatedUser): boolean {
    return user.role === "ADMIN" || user.role === "PROJECT_MANAGER";
  },

  canUpdate(
    user: AuthenticatedUser,
    projectManagerEmployeeId: string | null | undefined,
  ): boolean {
    return canManageProject(user, projectManagerEmployeeId);
  },

  canView(
    user: AuthenticatedUser,
    projectManagerEmployeeId?: string | null,
  ): boolean {
    return canViewProject(user, projectManagerEmployeeId);
  },

  isOwner(
    user: AuthenticatedUser,
    projectManagerEmployeeId: string | null | undefined,
  ): boolean {
    return isProjectManagerOwner(user, projectManagerEmployeeId);
  },

  assertCanUpdate(
    user: AuthenticatedUser,
    projectManagerEmployeeId: string | null | undefined,
    message = "Project not found.",
  ): void {
    assertCanManageProject(user, projectManagerEmployeeId, message);
  },

  /**
   * Role-scoped visibility filter for project list/detail queries (US03.01).
   * - ADMIN, RESOURCE_MANAGER: all projects
   * - PROJECT_MANAGER: projects they manage (projectManagerEmployeeId)
   * - EMPLOYEE: projects where they hold a non-cancelled allocation
   * Users without a linked employee (non-ADMIN/RM) match nothing.
   */
  scopeWhere(user: AuthenticatedUser): Prisma.ProjectWhereInput {
    if (user.role === ROLES.ADMIN || user.role === ROLES.RESOURCE_MANAGER) {
      return {};
    }
    if (!user.employeeId) return MATCH_NOTHING;
    if (user.role === ROLES.PROJECT_MANAGER) {
      return { projectManagerEmployeeId: user.employeeId };
    }
    if (user.role === ROLES.EMPLOYEE) {
      return {
        allocations: {
          some: { employeeId: user.employeeId, cancelledAt: null },
        },
      };
    }
    return MATCH_NOTHING;
  },
};
