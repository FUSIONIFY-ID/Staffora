import type { AuthenticatedUser } from "../../common/auth/types.js";
import { canManageAllocation } from "../../common/auth/policy.js";
import { NotFoundError } from "../../common/errors/app-error.js";

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
    if (!canManageAllocation(user, projectManagerEmployeeId)) {
      throw new NotFoundError(message);
    }
  },
};

export function assertCanManageAllocation(
  user: AuthenticatedUser,
  projectManagerEmployeeId: string | null | undefined,
  message = "Allocation not found.",
): void {
  allocationsPolicy.assertCanManage(user, projectManagerEmployeeId, message);
}
