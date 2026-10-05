import { prisma } from '../../common/database/prisma.js'
import type { Prisma } from '../../generated/prisma/client.js'

export const workforceRepository = {
  // Departments
  findDepartments() {
    return prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
  },

  createDepartment(name: string, actorId?: string) {
    return prisma.department.create({
      data: { name: name.trim(), createdBy: actorId },
    })
  },

  // Job Roles
  findJobRoles() {
    return prisma.jobRole.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
  },

  createJobRole(name: string, actorId?: string) {
    return prisma.jobRole.create({
      data: { name: name.trim(), createdBy: actorId },
    })
  },

  // Employees
  async findEmployees(params: {
    search?: string
    departmentId?: string
    jobRoleId?: string
    status?: 'ACTIVE' | 'INACTIVE'
    page: number
    pageSize: number
  }) {
    const where: Prisma.EmployeeWhereInput = {}

    if (params.status) {
      where.status = params.status
    }

    if (params.departmentId) {
      where.departmentId = params.departmentId
    }

    if (params.jobRoleId) {
      where.jobRoleId = params.jobRoleId
    }

    if (params.search) {
      const q = params.search.trim()
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { employeeCode: { contains: q, mode: 'insensitive' } },
        { workEmail: { contains: q, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          department: true,
          jobRole: true,
          allocations: {
            where: { cancelledAt: null },
          },
        },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        orderBy: { fullName: 'asc' },
      }),
      prisma.employee.count({ where }),
    ])

    return { data, total }
  },

  findEmployeeById(id: string) {
    return prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        jobRole: true,
        skills: {
          include: { skill: true },
        },
        allocations: {
          where: { cancelledAt: null },
          include: {
            project: true,
            jobRole: true,
          },
        },
      },
    })
  },

  findEmployeeByCode(code: string) {
    return prisma.employee.findUnique({
      where: { employeeCode: code.trim() },
    })
  },

  findEmployeeByEmail(email: string) {
    return prisma.employee.findUnique({
      where: { workEmail: email.trim().toLowerCase() },
    })
  },

  createEmployee(data: {
    employeeCode: string
    fullName: string
    workEmail: string
    departmentId: string
    jobRoleId: string
    status: 'ACTIVE' | 'INACTIVE'
    createdBy?: string
  }) {
    return prisma.employee.create({
      data: {
        employeeCode: data.employeeCode.trim(),
        fullName: data.fullName.trim(),
        workEmail: data.workEmail.trim().toLowerCase(),
        departmentId: data.departmentId,
        jobRoleId: data.jobRoleId,
        status: data.status,
        createdBy: data.createdBy,
      },
      include: {
        department: true,
        jobRole: true,
      },
    })
  },

  updateEmployee(
    id: string,
    data: {
      fullName?: string
      departmentId?: string
      jobRoleId?: string
      status?: 'ACTIVE' | 'INACTIVE'
      updatedBy?: string
    },
  ) {
    return prisma.employee.update({
      where: { id },
      data: {
        ...(data.fullName && { fullName: data.fullName.trim() }),
        ...(data.departmentId && { departmentId: data.departmentId }),
        ...(data.jobRoleId && { jobRoleId: data.jobRoleId }),
        ...(data.status && { status: data.status }),
        ...(data.updatedBy && { updatedBy: data.updatedBy }),
      },
      include: {
        department: true,
        jobRole: true,
      },
    })
  },
}
