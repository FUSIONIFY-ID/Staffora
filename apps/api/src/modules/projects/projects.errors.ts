import type {
  UniqueViolationMap,
  UniqueViolationTarget,
} from "../../common/errors/unique-violation.js";

export const PROJECT_CODE_DUPLICATE: UniqueViolationTarget = {
  code: "DUPLICATE_PROJECT_CODE",
  message: "A project with this code already exists.",
};

export const PROJECT_UNIQUE: UniqueViolationMap = {
  projects_project_code_key: PROJECT_CODE_DUPLICATE,
};
