import { AppError, HTTP_STATUS } from "../../common/errors/app-error.js";
import type {
  UniqueViolationMap,
  UniqueViolationTarget,
} from "../../common/errors/unique-violation.js";

/**
 * Unique-constraint responses for the skills module (PRD US02.02).
 *
 * The `@prisma/adapter-pg` driver adapter does not populate `meta.target` on a
 * P2002, so the violated index has to be read out of
 * `meta.driverAdapterError.cause.constraint.index`. That parsing is generic and
 * lives in `common/errors/unique-violation.js`, so this module reuses it
 * instead of maintaining a second copy. Only the index-to-response mapping is
 * skills-specific.
 */

export const DUPLICATE_SKILL_NAME: UniqueViolationTarget = {
  code: "DUPLICATE_SKILL_NAME",
  message: "A skill with this name already exists.",
};

export const SKILL_ALREADY_ASSIGNED: UniqueViolationTarget = {
  code: "SKILL_ALREADY_ASSIGNED",
  message: "This skill is already assigned to the employee.",
};

/**
 * Both the case-sensitive index declared in schema.prisma and the
 * case-insensitive `lower(name)` index added by migration
 * 20261018120000_skills_normalized_name_uniqueness report the same duplicate,
 * so both names map to the same response.
 */
export const SKILL_NAME_UNIQUE: UniqueViolationMap = {
  skills_name_key: DUPLICATE_SKILL_NAME,
  skills_name_lower_key: DUPLICATE_SKILL_NAME,
};

export const EMPLOYEE_SKILL_UNIQUE: UniqueViolationMap = {
  employee_skills_employee_id_skill_id_key: SKILL_ALREADY_ASSIGNED,
};

/**
 * AC01.05 / OpenAPI `POST /employees/{id}/skills`: assigning a deactivated
 * skill is a 422 that names the offending field and carries the documented
 * `SKILL_INACTIVE` code.
 *
 * `ValidationError` cannot express this: it hard-codes the code
 * `UNPROCESSABLE_ENTITY`, while the contract requires a specific code on this
 * one field-level rule. The class follows the same shape as
 * `CapacityConflictError`, the existing precedent for a domain-specific
 * `AppError` subclass.
 */
export class SkillInactiveError extends AppError {
  constructor(message = "Inactive skills cannot be newly assigned.") {
    super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, "SKILL_INACTIVE", {
      skillId: [message],
    });
  }
}

/**
 * AC01.05 / BR02: a skill reference that does not exist, or that is repeated
 * within one request, is a 422 naming the offending field as `skills`.
 *
 * OpenAPI documents this as `SKILL_REFERENCE_INVALID` with an `errors.skills`
 * entry, which `ValidationError` cannot express because it hard-codes the code
 * `UNPROCESSABLE_ENTITY`. Same shape as `SkillInactiveError` above.
 */
export class SkillReferenceError extends AppError {
  constructor(message = "Each skill must exist and may appear only once.") {
    super(
      message,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      "SKILL_REFERENCE_INVALID",
      {
        skills: [message],
      },
    );
  }
}

export {
  conflictError,
  mapUniqueViolation,
} from "../../common/errors/unique-violation.js";
