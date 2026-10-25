import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../common/database/prisma.js";
import { skillSelect } from "./skills.repository.js";
import type { EmployeeSkillRecord } from "./skills.types.js";

/**
 * An assignment always travels with the referenced skill, because the response
 * reports `skillName` and `skillIsActive` and the list is ordered by skill name.
 */
const employeeSkillInclude = {
  skill: { select: skillSelect },
} satisfies Prisma.EmployeeSkillInclude;

/**
 * True when Prisma reports that the row an update or delete targeted does not
 * exist (`P2025`). Both call sites below treat that as an ordinary absence
 * rather than an internal error, because a concurrent request can remove the
 * row between the service's pre-flight read and this write (F5).
 */
function isRecordNotFound(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}

/**
 * Employee-skill half of the skills module: the `employee_skills` rows.
 * Catalog access (`skills`, the `FOR SHARE` lock the assignment guard relies
 * on) lives in `skills.repository.ts`; the assignment service composes both.
 */
export const skillsEmployeeRepository = {
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

  /**
   * `tx` lets the caller run the insert inside the same transaction that holds
   * the `FOR SHARE` lock from `lockSkillsByIds` (F8); without it the insert
   * would take a separate connection and land after the lock was released.
   */
  createEmployeeSkill(
    data: Prisma.EmployeeSkillUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<EmployeeSkillRecord> {
    return (tx ?? prisma).employeeSkill.create({
      data,
      include: employeeSkillInclude,
    });
  },

  /**
   * Returns `null` when the row is already gone. The service's pre-flight
   * `findEmployeeSkill` can lose a race against a concurrent delete, and a
   * `P2025` there means "not found", so the caller answers 404 instead of
   * letting the error surface as a 500 (F5).
   */
  async updateEmployeeSkillProficiency(
    employeeId: string,
    skillId: string,
    proficiencyLevel: number,
    actorId?: string,
  ): Promise<EmployeeSkillRecord | null> {
    try {
      return await prisma.employeeSkill.update({
        where: { employeeId_skillId: { employeeId, skillId } },
        data: { proficiencyLevel, updatedBy: actorId },
        include: employeeSkillInclude,
      });
    } catch (error) {
      if (isRecordNotFound(error)) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Removes the assignment row only. The `skills` row is never deleted, so
   * other employees' history and any staffing requirement that references the
   * skill stay intact (BR03).
   *
   * Returns `false` when the row was already deleted by a concurrent request;
   * two racing deletes then answer 404 rather than one of them returning 500
   * (F5).
   */
  async deleteEmployeeSkill(
    employeeId: string,
    skillId: string,
  ): Promise<boolean> {
    try {
      await prisma.employeeSkill.delete({
        where: { employeeId_skillId: { employeeId, skillId } },
      });
      return true;
    } catch (error) {
      if (isRecordNotFound(error)) {
        return false;
      }
      throw error;
    }
  },
};
