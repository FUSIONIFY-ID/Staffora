import type { AuthenticatedUser } from "../../common/auth/types.js";
import { assertCanAccessEmployeeProfile } from "../../common/auth/policy.js";

/**
 * Employee-scope authorization for the skills module (PRD US02.02 - AC02.05).
 *
 * The shared helper already implements exactly this rule: ADMIN,
 * PROJECT_MANAGER and RESOURCE_MANAGER may read any employee, while an
 * EMPLOYEE may read only the employee record linked to their own account. It
 * fails with 404 rather than 403 so the response cannot be used to confirm
 * that an employee id exists, which is why the message is kept identical to the
 * one the service uses for a genuinely missing record.
 */
export const EMPLOYEE_SKILLS_NOT_FOUND = "Employee profile was not found.";

export const skillsPolicy = {
  assertCanViewEmployeeSkills(
    user: AuthenticatedUser,
    employeeId: string,
  ): void {
    assertCanAccessEmployeeProfile(user, employeeId, EMPLOYEE_SKILLS_NOT_FOUND);
  },
};
