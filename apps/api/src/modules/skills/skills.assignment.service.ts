import { NotFoundError } from "../../common/errors/app-error.js";
import type { AuthenticatedUser } from "../../common/auth/types.js";
import type {
  AssignSkillInput,
  EmployeeSkillListQuery,
  UpdateProficiencyInput,
} from "./skills.schema.js";
import { skillsRepository } from "./skills.repository.js";
import { toEmployeeSkillView } from "./skills.views.js";
import {
  EMPLOYEE_SKILLS_NOT_FOUND,
  skillsPolicy,
} from "./skills.policy.js";
import {
  EMPLOYEE_SKILL_UNIQUE,
  SKILL_ALREADY_ASSIGNED,
  SkillInactiveError,
  conflictError,
  mapUniqueViolation,
} from "./skills.errors.js";
import {
  ASSIGNMENT_NOT_FOUND,
  SKILL_NOT_FOUND,
} from "./skills.constants.js";
import type { EmployeeSkillView } from "./skills.types.js";

/**
 * Assignment half of the skills module: the `employee_skills` rows and the
 * guard other modules use before referencing a skill. Catalog CRUD lives in
 * `skills.catalog.service.ts`; both are composed into `skillsService` by
 * `skills.service.ts`.
 */
export const skillsAssignmentService = {
  /**
   * AC02.05 / TSD 11.1: an EMPLOYEE may read only their own list; the policy
   * answers 404 for any other id, with the same message a genuinely missing
   * employee gets. The list is bounded like the catalog so one employee's
   * history cannot return an unbounded payload.
   */
  async listEmployeeSkills(
    user: AuthenticatedUser,
    employeeId: string,
    query: EmployeeSkillListQuery,
  ): Promise<{
    data: EmployeeSkillView[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    skillsPolicy.assertCanViewEmployeeSkills(user, employeeId);

    const employee = await skillsRepository.findEmployeeById(employeeId);
    if (!employee) {
      throw new NotFoundError(EMPLOYEE_SKILLS_NOT_FOUND);
    }

    const [rows, total] = await Promise.all([
      skillsRepository.listEmployeeSkills(
        employeeId,
        (query.page - 1) * query.pageSize,
        query.pageSize,
      ),
      skillsRepository.countEmployeeSkills(employeeId),
    ]);

    return {
      data: rows.map(toEmployeeSkillView),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  },

  /**
   * AC01.05 / BR02: a deactivated skill cannot be newly assigned to an employee
   * or attached to a staffing requirement. Staffing validates existence itself,
   * so a missing id is deliberately not reported here; only the inactive flag
   * is this guard's concern.
   */
  async assertSkillsAssignable(skillIds: readonly string[]): Promise<void> {
    if (skillIds.length === 0) {
      return;
    }

    const skills = await skillsRepository.listSkillsByIds(skillIds);
    if (skills.some((skill) => !skill.isActive)) {
      throw new SkillInactiveError();
    }
  },

  /**
   * AC01.05 / AC02.01 / AC02.02 / AC02.03: only an active skill can be newly
   * assigned, and a pair can exist once. The role gate on the route already
   * restricts this to ADMIN and RESOURCE_MANAGER.
   */
  async assignSkill(
    user: AuthenticatedUser,
    employeeId: string,
    input: AssignSkillInput,
  ): Promise<EmployeeSkillView> {
    const employee = await skillsRepository.findEmployeeById(employeeId);
    if (!employee) {
      throw new NotFoundError(EMPLOYEE_SKILLS_NOT_FOUND);
    }

    const skill = await skillsRepository.findSkillById(input.skillId);
    if (!skill) {
      throw new NotFoundError(SKILL_NOT_FOUND);
    }
    if (!skill.isActive) {
      throw new SkillInactiveError();
    }

    const existing = await skillsRepository.findEmployeeSkill(
      employeeId,
      input.skillId,
    );
    if (existing) {
      throw conflictError(SKILL_ALREADY_ASSIGNED);
    }

    try {
      const assignment = await skillsRepository.createEmployeeSkill({
        employeeId,
        skillId: input.skillId,
        proficiencyLevel: input.proficiencyLevel,
        createdBy: user.id,
      });
      return toEmployeeSkillView(assignment);
    } catch (error) {
      return mapUniqueViolation(
        error,
        EMPLOYEE_SKILL_UNIQUE,
        SKILL_ALREADY_ASSIGNED,
      );
    }
  },

  /** AC02.04: the assignment must already exist; only its level changes. */
  async updateProficiency(
    employeeId: string,
    skillId: string,
    input: UpdateProficiencyInput,
    actorId?: string,
  ): Promise<EmployeeSkillView> {
    const existing = await skillsRepository.findEmployeeSkill(
      employeeId,
      skillId,
    );
    if (!existing) {
      throw new NotFoundError(ASSIGNMENT_NOT_FOUND);
    }

    const updated = await skillsRepository.updateEmployeeSkillProficiency(
      employeeId,
      skillId,
      input.proficiencyLevel,
      actorId,
    );
    return toEmployeeSkillView(updated);
  },

  /**
   * AC02.01 / BR03: deletes the `employee_skills` row only. The skill itself is
   * never removed, so other employees' assignments stay readable.
   */
  async removeEmployeeSkill(
    employeeId: string,
    skillId: string,
  ): Promise<void> {
    const existing = await skillsRepository.findEmployeeSkill(
      employeeId,
      skillId,
    );
    if (!existing) {
      throw new NotFoundError(ASSIGNMENT_NOT_FOUND);
    }

    await skillsRepository.deleteEmployeeSkill(employeeId, skillId);
  },
};
