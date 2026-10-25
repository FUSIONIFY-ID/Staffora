import type { Prisma, Project } from "../../generated/prisma/client.js";
import { prisma } from "../../common/database/prisma.js";

export type StaffingRequirementWithDetails =
  Prisma.StaffingRequirementGetPayload<{
    include: {
      jobRole: true;
      skills: {
        include: {
          skill: true;
        };
      };
    };
  }>;

export type StaffingRequirementWithSkills =
  Prisma.StaffingRequirementGetPayload<{
    include: {
      skills: {
        include: {
          skill: true;
        };
      };
    };
  }>;

export type StaffingRequirementWithProject =
  Prisma.StaffingRequirementGetPayload<{
    include: {
      project: true;
    };
  }>;

export const staffingRepository = {
  async findById(id: string): Promise<StaffingRequirementWithProject | null> {
    return prisma.staffingRequirement.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });
  },

  async findProjectById(projectId: string): Promise<Project | null> {
    return prisma.project.findUnique({
      where: { id: projectId },
    });
  },

  /**
   * F3 support: the ids currently attached to a requirement, used by the
   * update path to tell a newly added skill from one that was already attached
   * before it was deactivated. Only the id column is read.
   */
  async findSkillIdsByRequirementId(id: string): Promise<string[]> {
    const rows = await prisma.staffingRequirementSkill.findMany({
      where: { staffingRequirementId: id },
      select: { skillId: true },
    });
    return rows.map((row) => row.skillId);
  },

  async findByProjectId(
    projectId: string,
  ): Promise<StaffingRequirementWithDetails[]> {
    return prisma.staffingRequirement.findMany({
      where: { projectId },
      include: {
        jobRole: true,
        skills: {
          include: {
            skill: true,
          },
        },
      },
    });
  },

  /**
   * F8: the insert runs inside `prisma.$transaction`, and `beforeWrite` is the
   * seam for a caller that wants its guard to run in the same transaction
   * boundary as the write.
   *
   * The staffing service deliberately does not pass it today: the skills module
   * owns the `FOR SHARE` primitive that would actually close the race, and a
   * cross-module row lock is out of bounds here, so running the guard inside
   * this transaction without a lock would look atomic without being atomic. The
   * parameter exists so US03.02 can wire a shared transaction without changing
   * this signature again.
   */
  async create(
    data: {
      projectId: string;
      jobRoleId: string;
      headcount: number;
      allocationPercentage: number;
      startDate: Date;
      endDate: Date;
      skills?: { skillId: string; minimumProficiencyLevel: number }[];
      createdBy?: string;
    },
    beforeWrite?: (tx: Prisma.TransactionClient) => Promise<void>,
  ): Promise<StaffingRequirementWithSkills> {
    return prisma.$transaction(async (tx) => {
      if (beforeWrite) {
        await beforeWrite(tx);
      }

      return tx.staffingRequirement.create({
        data: {
          projectId: data.projectId,
          jobRoleId: data.jobRoleId,
          headcount: data.headcount,
          allocationPercentage: data.allocationPercentage,
          startDate: data.startDate,
          endDate: data.endDate,
          createdBy: data.createdBy,
          skills:
            data.skills && data.skills.length > 0
              ? {
                  create: data.skills.map((s) => ({
                    skillId: s.skillId,
                    minimumProficiencyLevel: s.minimumProficiencyLevel,
                  })),
                }
              : undefined,
        },
        include: {
          skills: {
            include: {
              skill: true,
            },
          },
        },
      });
    });
  },

  async update(
    id: string,
    data: {
      jobRoleId?: string;
      headcount?: number;
      allocationPercentage?: number;
      startDate?: Date;
      endDate?: Date;
      skills?: { skillId: string; minimumProficiencyLevel: number }[];
      updatedBy?: string;
    },
  ): Promise<StaffingRequirementWithSkills> {
    if (data.skills !== undefined) {
      return prisma.$transaction(async (tx) => {
        await tx.staffingRequirementSkill.deleteMany({
          where: { staffingRequirementId: id },
        });

        return tx.staffingRequirement.update({
          where: { id },
          data: {
            ...(data.jobRoleId ? { jobRoleId: data.jobRoleId } : {}),
            ...(data.headcount !== undefined
              ? { headcount: data.headcount }
              : {}),
            ...(data.allocationPercentage !== undefined
              ? { allocationPercentage: data.allocationPercentage }
              : {}),
            ...(data.startDate ? { startDate: data.startDate } : {}),
            ...(data.endDate ? { endDate: data.endDate } : {}),
            ...(data.updatedBy ? { updatedBy: data.updatedBy } : {}),
            ...(data.skills && data.skills.length > 0
              ? {
                  skills: {
                    create: data.skills.map((s) => ({
                      skillId: s.skillId,
                      minimumProficiencyLevel: s.minimumProficiencyLevel,
                    })),
                  },
                }
              : {}),
          },
          include: {
            skills: {
              include: {
                skill: true,
              },
            },
          },
        });
      });
    }

    return prisma.staffingRequirement.update({
      where: { id },
      data: {
        ...(data.jobRoleId ? { jobRoleId: data.jobRoleId } : {}),
        ...(data.headcount !== undefined ? { headcount: data.headcount } : {}),
        ...(data.allocationPercentage !== undefined
          ? { allocationPercentage: data.allocationPercentage }
          : {}),
        ...(data.startDate ? { startDate: data.startDate } : {}),
        ...(data.endDate ? { endDate: data.endDate } : {}),
        ...(data.updatedBy ? { updatedBy: data.updatedBy } : {}),
      },
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
      },
    });
  },
};
