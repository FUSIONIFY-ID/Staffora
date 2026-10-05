import { prisma } from '../../common/database/prisma.js'
import type { Prisma, ProjectStatus } from '../../generated/prisma/client.js'

export const projectsRepository = {
  async findProjects(params: {
    search?: string
    status?: ProjectStatus
    projectManagerEmployeeId?: string
    allocatedEmployeeId?: string
    page: number
    pageSize: number
  }) {
    const where: Prisma.ProjectWhereInput = {}

    if (params.status) {
      where.status = params.status
    }

    if (params.projectManagerEmployeeId) {
      where.projectManagerEmployeeId = params.projectManagerEmployeeId
    }

    if (params.allocatedEmployeeId) {
      where.allocations = {
        some: {
          employeeId: params.allocatedEmployeeId,
          cancelledAt: null,
        },
      }
    }

    if (params.search) {
      const q = params.search.trim()
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { projectCode: { contains: q, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          projectManager: true,
          staffingRequirements: true,
          allocations: {
            where: { cancelledAt: null },
          },
        },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        orderBy: { startDate: 'desc' },
      }),
      prisma.project.count({ where }),
    ])

    return { data, total }
  },

  findById(id: string) {
    return prisma.project.findUnique({
      where: { id },
      include: {
        projectManager: true,
        staffingRequirements: {
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
        },
        allocations: {
          where: { cancelledAt: null },
          include: {
            employee: true,
            jobRole: true,
          },
          orderBy: { startDate: 'asc' },
        },
      },
    })
  },

  findByCode(code: string) {
    return prisma.project.findUnique({
      where: { projectCode: code.trim() },
    })
  },

  create(data: {
    projectCode: string
    name: string
    projectManagerEmployeeId: string
    startDate: Date
    endDate: Date
    status: ProjectStatus
    createdBy?: string
  }) {
    return prisma.project.create({
      data: {
        projectCode: data.projectCode.trim(),
        name: data.name.trim(),
        projectManagerEmployeeId: data.projectManagerEmployeeId,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status,
        createdBy: data.createdBy,
      },
      include: {
        projectManager: true,
      },
    })
  },

  update(
    id: string,
    data: {
      name?: string
      projectManagerEmployeeId?: string
      startDate?: Date
      endDate?: Date
      status?: ProjectStatus
      updatedBy?: string
    },
  ) {
    return prisma.project.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.projectManagerEmployeeId && { projectManagerEmployeeId: data.projectManagerEmployeeId }),
        ...(data.startDate && { startDate: data.startDate }),
        ...(data.endDate && { endDate: data.endDate }),
        ...(data.status && { status: data.status }),
        ...(data.updatedBy && { updatedBy: data.updatedBy }),
      },
      include: {
        projectManager: true,
      },
    })
  },
}
