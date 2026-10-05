import { prisma } from '../../common/database/prisma.js'

export const staffingRepository = {
  findByProjectId(projectId: string) {
    return prisma.staffingRequirement.findMany({
      where: { projectId },
      include: {
        jobRole: true,
        skills: {
          include: { skill: true },
        },
        allocations: {
          where: { cancelledAt: null },
        },
      },
      orderBy: { startDate: 'asc' },
    })
  },

  findById(id: string) {
    return prisma.staffingRequirement.findUnique({
      where: { id },
      include: {
        project: true,
        jobRole: true,
        skills: {
          include: { skill: true },
        },
        allocations: {
          where: { cancelledAt: null },
          include: { employee: true },
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
    skills?: Array<{ skillId: string; minimumProficiencyLevel: number }>
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
        skills: data.skills?.length
          ? {
              create: data.skills.map((s) => ({
                skillId: s.skillId,
                minimumProficiencyLevel: s.minimumProficiencyLevel,
                createdBy: data.createdBy,
              })),
            }
          : undefined,
      },
      include: {
        jobRole: true,
        skills: {
          include: { skill: true },
        },
        allocations: {
          where: { cancelledAt: null },
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
      skills?: Array<{ skillId: string; minimumProficiencyLevel: number }>
      updatedBy?: string
    },
  ) {
    // If skills are provided, replace them
    if (data.skills) {
      await prisma.staffingRequirementSkill.deleteMany({
        where: { staffingRequirementId: id },
      })
    }

    return prisma.staffingRequirement.update({
      where: { id },
      data: {
        ...(data.jobRoleId && { jobRoleId: data.jobRoleId }),
        ...(data.headcount && { headcount: data.headcount }),
        ...(data.allocationPercentage && { allocationPercentage: data.allocationPercentage }),
        ...(data.startDate && { startDate: data.startDate }),
        ...(data.endDate && { endDate: data.endDate }),
        ...(data.updatedBy && { updatedBy: data.updatedBy }),
        ...(data.skills && {
          skills: {
            create: data.skills.map((s) => ({
              skillId: s.skillId,
              minimumProficiencyLevel: s.minimumProficiencyLevel,
              createdBy: data.updatedBy,
            })),
          },
        }),
      },
      include: {
        jobRole: true,
        skills: {
          include: { skill: true },
        },
        allocations: {
          where: { cancelledAt: null },
        },
      },
    })
  },

  delete(id: string) {
    return prisma.staffingRequirement.delete({
      where: { id },
    })
  },
}
