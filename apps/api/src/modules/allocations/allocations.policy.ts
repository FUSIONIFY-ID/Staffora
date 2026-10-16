import type { AuthenticatedUser } from "../../common/auth/types.js";
import {
  canManageAllocation,
  assertCanManageAllocation,
} from "../../common/auth/policy.js";

export const allocationsPolicy = {
  canManage(
    user: AuthenticatedUser,
    projectManagerEmployeeId: string | null | undefined,
  ): boolean {
    return canManageAllocation(user, projectManagerEmployeeId);
  },

  assertCanManage(
    user: AuthenticatedUser,
    projectManagerEmployeeId: string | null | undefined,
    message = "Allocation not found.",
  ): void {
    assertCanManageAllocation(user, projectManagerEmployeeId, message);
  },
};

export { assertCanManageAllocation };
