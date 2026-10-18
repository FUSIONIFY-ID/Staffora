import { prisma } from '../../common/database/prisma.js'

export interface QueryEmployeesFilter {
  search?: string
  departmentId?: string
  jobRoleId?: string
  status?: 'ACTIVE' | 'INACTIVE'
  page: number
  pageSize: number
}

export const workforceRepository = {
  async findDepartments() {
    return prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
  },

  async createDepartment(data: { name: string }) {
    return prisma.department.create({
      data: { name: data.name, isActive: true },
    })
  },

  async findJobRoles(_departmentId?: string) {
    return prisma.jobRole.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
  },

  async createJobRole(data: { name: string }) {
    return prisma.jobRole.create({
      data: { name: data.name, isActive: true },
    })
  },

  async findEmployees(filter: QueryEmployeesFilter) {
    const { search, departmentId, jobRoleId, status, page, pageSize } = filter

    const where: Record<string, unknown> = {}

    if (departmentId) {
      where.departmentId = departmentId
    }

    if (jobRoleId) {
      where.jobRoleId = jobRoleId
    }

    if (status) {
      where.status = status
    }

    if (search && search.trim()) {
      const term = search.trim()
      where.OR = [
        { fullName: { contains: term, mode: 'insensitive' } },
        { employeeCode: { contains: term, mode: 'insensitive' } },
        { workEmail: { contains: term, mode: 'insensitive' } },
      ]
    }

    const [total, data] = await Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        include: {
          department: true,
          jobRole: true,
          allocations: {
            where: { cancelledAt: null },
            include: {
              project: true,
              jobRole: true,
            },
          },
        },
        orderBy: { employeeCode: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    return { data, total, page, pageSize }
  },

  async findEmployeeById(id: string) {
    return prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        jobRole: true,
        skills: {
          include: {
            skill: true,
          },
        },
        allocations: {
          include: {
            project: true,
            jobRole: true,
          },
          orderBy: { startDate: 'desc' },
        },
      },
    })
  },

  async createEmployee(data: {
    employeeCode: string
    fullName: string
    workEmail: string
    departmentId: string
    jobRoleId: string
    status?: 'ACTIVE' | 'INACTIVE'
  }) {
    return prisma.employee.create({
      data: {
        employeeCode: data.employeeCode,
        fullName: data.fullName,
        workEmail: data.workEmail,
        departmentId: data.departmentId,
        jobRoleId: data.jobRoleId,
        status: data.status || 'ACTIVE',
      },
      include: {
        department: true,
        jobRole: true,
      },
    })
  },

  async updateEmployee(
    id: string,
    data: {
      fullName?: string
      departmentId?: string
      jobRoleId?: string
      status?: 'ACTIVE' | 'INACTIVE'
    },
  ) {
    return prisma.employee.update({
      where: { id },
      data,
      include: {
        department: true,
        jobRole: true,
      },
    })
  },
}
