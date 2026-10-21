import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../common/database/prisma.js";
import type {
  EmployeeSkillRecord,
  SkillRecord,
} from "./skills.types.js";

/** Catalog projection: the three fields the `Skill` contract exposes. */
const skillSelect = {
  id: true,
  name: true,
  isActive: true,
} satisfies Prisma.SkillSelect;

/**
 * An assignment always travels with the referenced skill, because the response
 * reports `skillName` and `skillIsActive` and the list is ordered by skill name.
 */
const employeeSkillInclude = {
  skill: { select: skillSelect },
} satisfies Prisma.EmployeeSkillInclude;

export const skillsRepository = {
  listSkills(
    where: Prisma.SkillWhereInput,
    skip: number,
    take: number,
  ): Promise<SkillRecord[]> {
    return prisma.skill.findMany({
      where,
      select: skillSelect,
      orderBy: { name: "asc" },
      skip,
      take,
    });
  },

  countSkills(where: Prisma.SkillWhereInput): Promise<number> {
    return prisma.skill.count({ where });
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

  findEmployeeById(id: string): Promise<{ id: string } | null> {
    return prisma.employee.findUnique({
      where: { id },
      select: { id: true },
    });
  },

  listEmployeeSkills(
    employeeId: string,
    skip: number,
    take: number,
  ): Promise<EmployeeSkillRecord[]> {
    return prisma.employeeSkill.findMany({
      where: { employeeId },
      include: employeeSkillInclude,
      orderBy: { skill: { name: "asc" } },
      skip,
      take,
    });
  },

  countEmployeeSkills(employeeId: string): Promise<number> {
    return prisma.employeeSkill.count({ where: { employeeId } });
  },

  findEmployeeSkill(
    employeeId: string,
    skillId: string,
  ): Promise<EmployeeSkillRecord | null> {
    return prisma.employeeSkill.findUnique({
      where: { employeeId_skillId: { employeeId, skillId } },
      include: employeeSkillInclude,
    });
  },

  createEmployeeSkill(
    data: Prisma.EmployeeSkillUncheckedCreateInput,
  ): Promise<EmployeeSkillRecord> {
    return prisma.employeeSkill.create({
      data,
      include: employeeSkillInclude,
    });
  },

  updateEmployeeSkillProficiency(
    employeeId: string,
    skillId: string,
    proficiencyLevel: number,
    actorId?: string,
  ): Promise<EmployeeSkillRecord> {
    return prisma.employeeSkill.update({
      where: { employeeId_skillId: { employeeId, skillId } },
      data: { proficiencyLevel, updatedBy: actorId },
      include: employeeSkillInclude,
    });
  },

  /**
   * Removes the assignment row only. The `skills` row is never deleted, so
   * other employees' history and any staffing requirement that references the
   * skill stay intact (BR03).
   */
  async deleteEmployeeSkill(
    employeeId: string,
    skillId: string,
  ): Promise<void> {
    await prisma.employeeSkill.delete({
      where: { employeeId_skillId: { employeeId, skillId } },
    });
  },
};
