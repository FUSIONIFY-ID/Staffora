import type { AuthenticatedUser } from "../../common/auth/types.js";
import {
  canAccessEmployeeProfile,
  assertCanAccessEmployeeProfile,
} from "../../common/auth/policy.js";

/**
 * Employee-scope authorization for the workforce module.
 *
 * CODING_STANDARD 3.1 and 3.2 keep authorization out of controllers, so the
 * service calls these helpers before returning a profile.
 *
 * The failure mode is deliberate non-disclosure: an employee requesting a
 * colleague's record gets the same 404 as a record that does not exist. A
 * distinct 403 would confirm that the ID is a real employee, which lets a
 * caller enumerate the workforce.
 */
export const workforcePolicy = {
  canViewEmployee(user: AuthenticatedUser, employeeId: string): boolean {
    return canAccessEmployeeProfile(user, employeeId);
  },

  canManageEmployee(user: AuthenticatedUser): boolean {
    return user.role === "ADMIN" || user.role === "RESOURCE_MANAGER";
  },

  assertCanViewEmployee(
    user: AuthenticatedUser,
    employeeId: string,
    message = "Employee profile was not found.",
  ): void {
    assertCanAccessEmployeeProfile(user, employeeId, message);
  },
};
