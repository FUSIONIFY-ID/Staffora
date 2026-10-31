import type {
  UniqueViolationMap,
  UniqueViolationTarget,
} from "../../common/errors/unique-violation.js";

/**
 * The P2002 handling itself is generic, so it lives in `common/errors` and is
 * re-exported here to keep every existing workforce importer unchanged. Only
 * the workforce-specific codes and index maps belong to this module.
 */
export {
  conflictError,
  mapUniqueViolation,
} from "../../common/errors/unique-violation.js";
export type {
  UniqueViolationMap,
  UniqueViolationTarget,
} from "../../common/errors/unique-violation.js";

export const DEPARTMENT_NAME_DUPLICATE: UniqueViolationTarget = {
  code: "DUPLICATE_DEPARTMENT_NAME",
  message: "A department with this name already exists.",
};

export const JOB_ROLE_NAME_DUPLICATE: UniqueViolationTarget = {
  code: "DUPLICATE_JOB_ROLE_NAME",
  message: "A job role with this title already exists.",
};

export const EMPLOYEE_CODE_DUPLICATE: UniqueViolationTarget = {
  code: "DUPLICATE_EMPLOYEE_CODE",
  message: "An employee with this code already exists.",
};

export const WORK_EMAIL_DUPLICATE: UniqueViolationTarget = {
  code: "DUPLICATE_WORK_EMAIL",
  message: "An employee with this work email already exists.",
};

export const EMPLOYEE_DUPLICATE_FALLBACK: UniqueViolationTarget = {
  code: "DUPLICATE_RESOURCE",
  message: "An employee with this code or work email already exists.",
};

/**
 * Unique indexes that guard master-data names. The case-sensitive index declared
 * in schema.prisma and the case-insensitive `lower(name)` index added by
 * migration 20261014160000_workforce_normalized_name_uniqueness report the same
 * duplicate, so both names map to the same response code.
 */
export const DEPARTMENT_NAME_UNIQUE: UniqueViolationMap = {
  departments_name_key: DEPARTMENT_NAME_DUPLICATE,
  departments_name_lower_key: DEPARTMENT_NAME_DUPLICATE,
};

export const JOB_ROLE_NAME_UNIQUE: UniqueViolationMap = {
  job_roles_name_key: JOB_ROLE_NAME_DUPLICATE,
  job_roles_name_lower_key: JOB_ROLE_NAME_DUPLICATE,
};

export const EMPLOYEE_UNIQUE: UniqueViolationMap = {
  employees_employee_code_key: EMPLOYEE_CODE_DUPLICATE,
  employees_work_email_key: WORK_EMAIL_DUPLICATE,
};
