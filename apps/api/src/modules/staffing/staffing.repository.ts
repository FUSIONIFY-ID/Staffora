import { prisma } from '../../common/database/prisma.js'

export const staffingRepository = {
  async findById(id: string) {
    return prisma.staffingRequirement.findUnique({
      where: { id },
      include: {
        project: true,
      },
    })
  },

  async findProjectById(projectId: string) {
    return prisma.project.findUnique({
      where: { id: projectId },
    })
  },

  async findByProjectId(projectId: string) {
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
    })
  },

  async create(data: {
    projectId: string
    jobRoleId: string
    headcount: number
    allocationPercentage: number
    startDate: Date
    endDate: Date
    skills?: { skillId: string; minimumProficiencyLevel: number }[]
    createdBy?: string
  }) {
    return prisma.staffingRequirement.create({
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
    })
  },

  async update(
    id: string,
    data: {
      jobRoleId?: string
      headcount?: number
      allocationPercentage?: number
      startDate?: Date
      endDate?: Date
      skills?: { skillId: string; minimumProficiencyLevel: number }[]
      updatedBy?: string
    },
  ) {
    if (data.skills !== undefined) {
      return prisma.$transaction(async (tx) => {
        await tx.staffingRequirementSkill.deleteMany({
          where: { staffingRequirementId: id },
        })

        return tx.staffingRequirement.update({
          where: { id },
          data: {
            ...(data.jobRoleId ? { jobRoleId: data.jobRoleId } : {}),
            ...(data.headcount !== undefined ? { headcount: data.headcount } : {}),
            ...(data.allocationPercentage !== undefined ? { allocationPercentage: data.allocationPercentage } : {}),
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
        })
      })
    }

    return prisma.staffingRequirement.update({
      where: { id },
      data: {
        ...(data.jobRoleId ? { jobRoleId: data.jobRoleId } : {}),
        ...(data.headcount !== undefined ? { headcount: data.headcount } : {}),
        ...(data.allocationPercentage !== undefined ? { allocationPercentage: data.allocationPercentage } : {}),
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
    })
  },
}

