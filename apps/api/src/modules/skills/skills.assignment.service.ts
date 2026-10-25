import { NotFoundError } from "../../common/errors/app-error.js";
import { prisma } from "../../common/database/prisma.js";
import type { AuthenticatedUser } from "../../common/auth/types.js";
import type {
  AssignSkillInput,
  EmployeeSkillListQuery,
  UpdateProficiencyInput,
} from "./skills.schema.js";
import { skillsRepository } from "./skills.repository.js";
import { skillsEmployeeRepository } from "./skills.employee.repository.js";
import { toEmployeeSkillView } from "./skills.views.js";
import {
  EMPLOYEE_SKILLS_NOT_FOUND,
  skillsPolicy,
} from "./skills.policy.js";
import {
  EMPLOYEE_SKILL_UNIQUE,
  SKILL_ALREADY_ASSIGNED,
  SkillInactiveError,
  SkillReferenceError,
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

    const employee =
      await skillsEmployeeRepository.findEmployeeById(employeeId);
    if (!employee) {
      throw new NotFoundError(EMPLOYEE_SKILLS_NOT_FOUND);
    }

    const [rows, total] = await Promise.all([
      skillsEmployeeRepository.listEmployeeSkills(
        employeeId,
        (query.page - 1) * query.pageSize,
        query.pageSize,
      ),
      skillsEmployeeRepository.countEmployeeSkills(employeeId),
    ]);

    return {
      data: rows.map(toEmployeeSkillView),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  },

  /**
   * AC01.05 / BR02: every referenced skill must exist and may appear only once
   * in a request. This is the only implementation of that rule; staffing
   * requirements apply the same guard (and `assertSkillsActive` below) before
   * attaching skills, so the rule lives here once instead of per module.
   */
  async assertSkillReferencesValid(skillIds: readonly string[]): Promise<void> {
    if (skillIds.length === 0) {
      return;
    }

    if (new Set(skillIds).size !== skillIds.length) {
      throw new SkillReferenceError(
        "The same skill cannot be referenced twice.",
      );
    }

    const skills = await skillsRepository.listSkillsByIds(skillIds);
    const found = new Set(skills.map((skill) => skill.id));
    if (skillIds.some((id) => !found.has(id))) {
      throw new SkillReferenceError("A referenced skill does not exist.");
    }
  },

  /**
   * AC01.05 / BR02: a deactivated skill cannot be newly assigned to an employee
   * or attached to a staffing requirement. This is the only implementation of
   * the active-skill rule; staffing requirements apply it together with
   * `assertSkillReferencesValid` above, so the rule lives here once.
   *
   * Existence is `assertSkillReferencesValid`'s concern: a missing id is
   * simply absent from the lookup and is deliberately not reported here.
   */
  async assertSkillsActive(skillIds: readonly string[]): Promise<void> {
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
    const employee =
      await skillsEmployeeRepository.findEmployeeById(employeeId);
    if (!employee) {
      throw new NotFoundError(EMPLOYEE_SKILLS_NOT_FOUND);
    }

    return prisma.$transaction(async (tx) => {
      // F8: the lock and the insert share one transaction, so a concurrent
      // deactivation either commits before this read (and is rejected below)
      // or waits for the commit, instead of slipping between check and insert.
      const locked = await skillsRepository.lockSkillsByIds(tx, [
        input.skillId,
      ]);
      // Indexed access is `| undefined` under `noUncheckedIndexedAccess`; the
      // explicit destructure keeps the missing row a 404 without a `!`.
      const [skill] = locked;
      if (!skill) {
        throw new NotFoundError(SKILL_NOT_FOUND);
      }
      if (!skill.isActive) {
        throw new SkillInactiveError();
      }

      const existing = await skillsEmployeeRepository.findEmployeeSkill(
        employeeId,
        input.skillId,
      );
      if (existing) {
        throw conflictError(SKILL_ALREADY_ASSIGNED);
      }

      try {
        const assignment = await skillsEmployeeRepository.createEmployeeSkill(
          {
            employeeId,
            skillId: input.skillId,
            proficiencyLevel: input.proficiencyLevel,
            createdBy: user.id,
          },
          tx,
        );
        return toEmployeeSkillView(assignment);
      } catch (error) {
        return mapUniqueViolation(
          error,
          EMPLOYEE_SKILL_UNIQUE,
          SKILL_ALREADY_ASSIGNED,
        );
      }
    });
  },

  /** AC02.04: the assignment must already exist; only its level changes. */
  async updateProficiency(
    employeeId: string,
    skillId: string,
    input: UpdateProficiencyInput,
    actorId?: string,
  ): Promise<EmployeeSkillView> {
    const existing = await skillsEmployeeRepository.findEmployeeSkill(
      employeeId,
      skillId,
    );
    if (!existing) {
      throw new NotFoundError(ASSIGNMENT_NOT_FOUND);
    }

    const updated =
      await skillsEmployeeRepository.updateEmployeeSkillProficiency(
        employeeId,
        skillId,
        input.proficiencyLevel,
        actorId,
      );
    // F5: a concurrent delete can remove the row after the pre-flight read, so
    // the repository reports that as `null` instead of letting P2025 become a
    // 500. It is still a missing assignment.
    if (!updated) {
      throw new NotFoundError(ASSIGNMENT_NOT_FOUND);
    }
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
    const existing = await skillsEmployeeRepository.findEmployeeSkill(
      employeeId,
      skillId,
    );
    if (!existing) {
      throw new NotFoundError(ASSIGNMENT_NOT_FOUND);
    }

    // F5: the pre-flight read above can lose a race against a concurrent
    // delete. The repository reports the vanished row as `false` rather than
    // letting P2025 surface as a 500; it is still a missing assignment.
    const removed = await skillsEmployeeRepository.deleteEmployeeSkill(
      employeeId,
      skillId,
    );
    if (!removed) {
      throw new NotFoundError(ASSIGNMENT_NOT_FOUND);
    }
  },
};
