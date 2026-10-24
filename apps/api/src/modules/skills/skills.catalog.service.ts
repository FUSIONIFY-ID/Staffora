import type { Prisma } from "../../generated/prisma/client.js";
import { NotFoundError } from "../../common/errors/app-error.js";
import type {
  CreateSkillInput,
  SkillListQuery,
  UpdateSkillInput,
} from "./skills.schema.js";
import { skillsRepository } from "./skills.repository.js";
import { toSkillView } from "./skills.views.js";
import {
  DUPLICATE_SKILL_NAME,
  SKILL_NAME_UNIQUE,
  conflictError,
  mapUniqueViolation,
} from "./skills.errors.js";
import { SKILL_NOT_FOUND } from "./skills.constants.js";
import type { SkillListResult, SkillView } from "./skills.types.js";

/**
 * Catalog half of the skills module: the reusable `Skill` rows themselves.
 * Employee assignments live in `skills.assignment.service.ts`; both are
 * composed into `skillsService` by `skills.service.ts`.
 */
export const skillsCatalogService = {
  /**
   * AC01.04 / AC02.05: the catalog is paginated and filterable. Inactive
   * skills stay in the result unless `isActive` is supplied, so historical
   * assignments remain interpretable.
   */
  async listSkills(query: SkillListQuery): Promise<SkillListResult> {
    const search = query.q?.trim();
    const where: Prisma.SkillWhereInput = {
      ...(search
        ? { name: { contains: search, mode: "insensitive" } }
        : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
    };

    const [rows, total] = await Promise.all([
      skillsRepository.listSkills(where, (query.page - 1) * query.pageSize, query.pageSize),
      skillsRepository.countSkills(where),
    ]);

    return {
      data: rows.map(toSkillView),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  },

  /**
   * AC01.01 / AC01.03: the name arrives already trimmed and whitespace-collapsed
   * from the schema. The pre-flight lookup produces the friendly 409 in the
   * sequential case; the unique index is what actually enforces the rule, so a
   * concurrent duplicate is mapped through `mapUniqueViolation`.
   */
  async createSkill(
    input: CreateSkillInput,
    actorId?: string,
  ): Promise<SkillView> {
    if (await skillsRepository.findSkillByNameInsensitive(input.name)) {
      throw conflictError(DUPLICATE_SKILL_NAME);
    }

    try {
      const skill = await skillsRepository.createSkill(input.name, actorId);
      return toSkillView(skill);
    } catch (error) {
      return mapUniqueViolation(
        error,
        SKILL_NAME_UNIQUE,
        DUPLICATE_SKILL_NAME,
      );
    }
  },

  /**
   * AC01.03 / AC01.04: rename or toggle Active. A rename is checked against
   * other skills only, so re-submitting the same name (in any casing) is not a
   * conflict with itself.
   */
  async updateSkill(
    id: string,
    input: UpdateSkillInput,
    actorId?: string,
  ): Promise<SkillView> {
    const existing = await skillsRepository.findSkillById(id);
    if (!existing) {
      throw new NotFoundError(SKILL_NOT_FOUND);
    }

    if (input.name !== undefined) {
      const duplicate = await skillsRepository.findSkillByNameInsensitive(
        input.name,
      );
      if (duplicate && duplicate.id !== id) {
        throw conflictError(DUPLICATE_SKILL_NAME);
      }
    }

    try {
      const updated = await skillsRepository.updateSkill(id, {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        updatedBy: actorId,
      });
      return toSkillView(updated);
    } catch (error) {
      return mapUniqueViolation(
        error,
        SKILL_NAME_UNIQUE,
        DUPLICATE_SKILL_NAME,
      );
    }
  },
};
