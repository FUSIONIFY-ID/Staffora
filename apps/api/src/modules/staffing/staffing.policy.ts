import type { AuthenticatedUser } from '../../common/auth/types.js'
import {
  canManageProject,
  assertCanManageProject,
} from '../../common/auth/policy.js'

export const staffingPolicy = {
  canManage(user: AuthenticatedUser, projectManagerEmployeeId: string | null | undefined): boolean {
    return canManageProject(user, projectManagerEmployeeId)
  },

  assertCanManage(
    user: AuthenticatedUser,
    projectManagerEmployeeId: string | null | undefined,
    message = 'Staffing requirement not found.',
  ): void {
    assertCanManageProject(user, projectManagerEmployeeId, message)
  },
}
