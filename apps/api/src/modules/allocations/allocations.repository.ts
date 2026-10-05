import { prisma } from '../../common/database/prisma.js'

export const allocationsRepository = {
  findAll(params?: {
    employeeId?: string
    projectId?: string
    startDate?: string
    endDate?: string
  }) {
    const where: Record<string, unknown> = {}

    if (params?.employeeId) {
      where.employeeId = params.employeeId
    }

    if (params?.projectId) {
      where.projectId = params.projectId
    }

    if (params?.startDate && params?.endDate) {
      where.startDate = { lte: new Date(params.endDate + 'T00:00:00Z') }
      where.endDate = { gte: new Date(params.startDate + 'T00:00:00Z') }
    }

    return prisma.allocation.findMany({
      where,
      include: {
        employee: true,
        project: true,
        jobRole: true,
        staffingRequirement: true,
      },
      orderBy: { startDate: 'desc' },
    })
  },

  findById(id: string) {
    return prisma.allocation.findUnique({
      where: { id },
      include: {
        employee: true,
        project: true,
        jobRole: true,
        staffingRequirement: true,
      },
    })
  },

  findNonCancelledByEmployee(employeeId: string) {
    return prisma.allocation.findMany({
      where: {
        employeeId,
        cancelledAt: null,
      },
      orderBy: { startDate: 'asc' },
    })
  },

  cancel(id: string, actorId?: string) {
    return prisma.allocation.update({
      where: { id },
      data: {
        cancelledAt: new Date(),
        cancelledBy: actorId,
        updatedBy: actorId,
      },
      include: {
        employee: true,
        project: true,
        jobRole: true,
      },
    })
  },

  end(id: string, newEndDate: Date, actorId?: string) {
    return prisma.allocation.update({
      where: { id },
      data: {
        endDate: newEndDate,
        updatedBy: actorId,
      },
      include: {
        employee: true,
        project: true,
        jobRole: true,
      },
    })
  },
}
