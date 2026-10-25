import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../common/database/prisma.js";
import type { SkillRecord } from "./skills.types.js";

/**
 * Catalog search/filter input. Deliberately not a Prisma type: the services
 * pass domain values, and turning them into a `Prisma.SkillWhereInput` is this
 * repository's job (F9).
 */
export interface SkillListFilter {
  q?: string;
  isActive?: boolean;
}

/**
 * Catalog projection: the three fields the `Skill` contract exposes. Shared
 * with `skills.employee.repository.ts`, whose include embeds the same skill
 * projection.
 */
export const skillSelect = {
  id: true,
  name: true,
  isActive: true,
} satisfies Prisma.SkillSelect;

/** Raw row shape returned by the `FOR SHARE` lock query (snake_case columns). */
interface LockedSkillRow {
  id: string;
  name: string;
  is_active: boolean;
}

/**
 * Escapes the characters that `LIKE` treats as wildcards so a user-supplied
 * search term is matched literally (F7).
 *
 * Prisma's `contains` compiles to `ILIKE '%' || $1 || '%'` and offers no way to
 * add an `ESCAPE` clause, so the pattern has to carry its own escapes. This is
 * only correct because PostgreSQL's default `LIKE` escape character is the
 * backslash. Verified against the running database (PostgreSQL 18.4,
 * `standard_conforming_strings = on`): `'a%b' LIKE 'a\%b'` is true while
 * `'axb' LIKE 'a\%b'` is false, and the same holds for `_`. Also verified
 * through Prisma: `contains: "%"` matched all 12 seeded skills, while
 * `contains: "\\%"` matched only the single name containing a literal `%`.
 *
 * The backslash must be escaped first, otherwise `\%` would become `\\%` and
 * degrade into "a literal backslash followed by any suffix".
 */
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

/** Builds the Prisma filter for the catalog list/count pair. */
function buildSkillWhere(filter: SkillListFilter): Prisma.SkillWhereInput {
  const search = filter.q?.trim();

  return {
    ...(search ? { name: { contains: escapeLikePattern(search), mode: "insensitive" } } : {}),
    ...(filter.isActive !== undefined ? { isActive: filter.isActive } : {}),
  };
}

export const skillsRepository = {
  listSkills(
    filter: SkillListFilter,
    skip: number,
    take: number,
  ): Promise<SkillRecord[]> {
    return prisma.skill.findMany({
      where: buildSkillWhere(filter),
      select: skillSelect,
      orderBy: { name: "asc" },
      skip,
      take,
    });
  },

  countSkills(filter: SkillListFilter): Promise<number> {
    return prisma.skill.count({ where: buildSkillWhere(filter) });
  },

  findSkillById(id: string): Promise<SkillRecord | null> {
    return prisma.skill.findUnique({
      where: { id },
      select: skillSelect,
    });
  },

  /**
   * Single-query lookup used by the AC01.05 / BR02 guard that staffing
   * requirements apply before they attach skills. Ids that do not exist are
   * simply absent from the result; existence is validated elsewhere.
   */
  listSkillsByIds(ids: readonly string[]): Promise<SkillRecord[]> {
    return prisma.skill.findMany({
      where: { id: { in: [...ids] } },
      select: skillSelect,
    });
  },

  /**
   * Takes a shared row lock on every requested skill inside the caller's
   * transaction (F8 support for the AC01.05 check-then-insert).
   *
   * `FOR SHARE` blocks a concurrent `UPDATE skills SET is_active = false` until
   * the surrounding transaction commits, because a row-exclusive lock cannot be
   * granted while a shared lock is held. That is exactly the race the guard has
   * to close: without it, `assignSkill` could read `is_active = true` and then
   * insert the assignment after another transaction deactivated the skill.
   * Verified against the running database: a concurrent
   * `UPDATE ... SET is_active = false` stayed blocked for the full 1.2s
   * `lock_timeout` and only succeeded after the holding transaction committed.
   *
   * `FOR SHARE` (not `FOR UPDATE`) is used because the guard only reads the
   * rows; it does not modify them, so other readers must not be serialised.
   * Rows are returned in the table's physical order, so callers that need a
   * stable order must sort them.
   */
  async lockSkillsByIds(
    tx: Prisma.TransactionClient,
    ids: readonly string[],
  ): Promise<SkillRecord[]> {
    if (ids.length === 0) {
      return [];
    }

    const rows = await tx.$queryRaw<LockedSkillRow[]>`
      SELECT id, name, is_active
      FROM skills
      WHERE id = ANY(${[...ids]}::uuid[])
      FOR SHARE
    `;

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      isActive: row.is_active,
    }));
  },

  /**
   * Case-insensitive lookup for a friendly pre-flight message. The database
   * unique index is what actually enforces the rule; this only turns the common
   * sequential duplicate into a specific 409.
   */
  findSkillByNameInsensitive(name: string): Promise<{ id: string } | null> {
    return prisma.skill.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
      select: { id: true },
    });
  },

  createSkill(name: string, actorId?: string): Promise<SkillRecord> {
    return prisma.skill.create({
      data: { name, createdBy: actorId },
      select: skillSelect,
    });
  },

  updateSkill(
    id: string,
    data: Prisma.SkillUncheckedUpdateInput,
  ): Promise<SkillRecord> {
    return prisma.skill.update({
      where: { id },
      data,
      select: skillSelect,
    });
  },
};
