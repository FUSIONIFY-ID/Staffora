import { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../../common/database/prisma.js'

export const employeeSummaryInclude = {
  department: { select: { id: true, name: true } },
  jobRole: { select: { id: true, name: true } },
} satisfies Prisma.EmployeeInclude

export const employeeDetailInclude = {
  ...employeeSummaryInclude,
  skills: {
    include: { skill: { select: { id: true, name: true, isActive: true } } },
    orderBy: { skill: { name: 'asc' } },
  },
  allocations: {
    include: {
      project: { select: { projectCode: true, name: true } },
      jobRole: { select: { id: true, name: true } },
    },
    orderBy: [{ startDate: 'asc' }, { endDate: 'asc' }],
  },
} satisfies Prisma.EmployeeInclude

export const workforceRepository = {
  findEmployeeById(id: string): Promise<Prisma.EmployeeGetPayload<{ include: typeof employeeSummaryInclude }> | null> {
    return prisma.employee.findUnique({ where: { id }, include: employeeSummaryInclude })
  },

  findEmployeeByCode(employeeCode: string): Promise<{ id: string } | null> {
    return prisma.employee.findUnique({ where: { employeeCode }, select: { id: true } })
  },

  findEmployeeByEmail(workEmail: string): Promise<{ id: string } | null> {
    return prisma.employee.findUnique({ where: { workEmail }, select: { id: true } })
  },

  findDepartmentById(id: string): Promise<{ id: string; name: string } | null> {
    return prisma.department.findUnique({ where: { id }, select: { id: true, name: true } })
  },

  findJobRoleById(id: string): Promise<{ id: string; name: string } | null> {
    return prisma.jobRole.findUnique({ where: { id }, select: { id: true, name: true } })
  },

  listDepartments(): Promise<Array<{ id: string; name: string; isActive: boolean }>> {
    return prisma.department.findMany({
      where: { isActive: true },
      select: { id: true, name: true, isActive: true },
      orderBy: { name: 'asc' },
    })
  },

  listJobRoles(): Promise<Array<{ id: string; name: string; isActive: boolean }>> {
    return prisma.jobRole.findMany({
      where: { isActive: true },
      select: { id: true, name: true, isActive: true },
      orderBy: { name: 'asc' },
    })
  },

  createDepartment(name: string, actorId?: string) {
    return prisma.department.create({
      data: { name, createdBy: actorId },
      select: { id: true, name: true, isActive: true },
    })
  },

  createJobRole(name: string, actorId?: string) {
    return prisma.jobRole.create({
      data: { name, createdBy: actorId },
      select: { id: true, name: true, isActive: true },
    })
  },

  countEmployees(where: Prisma.EmployeeWhereInput): Promise<number> {
    return prisma.employee.count({ where })
  },

  listEmployees(
    where: Prisma.EmployeeWhereInput,
    skip: number,
    take: number,
  ): Promise<Array<Prisma.EmployeeGetPayload<{ include: typeof employeeSummaryInclude }>>> {
    return prisma.employee.findMany({
      where,
      include: employeeSummaryInclude,
      orderBy: { fullName: 'asc' },
      skip,
      take,
    })
  },

  findEmployeeDetail(id: string): Promise<Prisma.EmployeeGetPayload<{ include: typeof employeeDetailInclude }> | null> {
    return prisma.employee.findUnique({ where: { id }, include: employeeDetailInclude })
  },

  createEmployee(
    data: Prisma.EmployeeUncheckedCreateInput,
  ): Promise<Prisma.EmployeeGetPayload<{ include: typeof employeeSummaryInclude }>> {
    return prisma.employee.create({ data, include: employeeSummaryInclude })
  },

  updateEmployee(
    id: string,
    data: Prisma.EmployeeUncheckedUpdateInput,
  ): Promise<Prisma.EmployeeGetPayload<{ include: typeof employeeSummaryInclude }>> {
    return prisma.employee.update({ where: { id }, data, include: employeeSummaryInclude })
  },
}
