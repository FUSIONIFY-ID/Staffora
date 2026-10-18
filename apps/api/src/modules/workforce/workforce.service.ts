import { workforceRepository, type QueryEmployeesFilter } from './workforce.repository.js'
import { NotFoundError } from '../../common/errors/app-error.js'

export const workforceService = {
  async getDepartments() {
    return workforceRepository.findDepartments()
  },

  async createDepartment(data: { name: string }) {
    return workforceRepository.createDepartment(data)
  },

  async getJobRoles(departmentId?: string) {
    return workforceRepository.findJobRoles(departmentId)
  },

  async createJobRole(data: { name: string }) {
    return workforceRepository.createJobRole(data)
  },

  async getEmployees(query: Record<string, unknown>) {
    const filter: QueryEmployeesFilter = {
      search: typeof query.search === 'string' ? query.search : undefined,
      departmentId: typeof query.departmentId === 'string' ? query.departmentId : undefined,
      jobRoleId: typeof query.jobRoleId === 'string' ? query.jobRoleId : undefined,
      status:
        query.status === 'ACTIVE' || query.status === 'INACTIVE'
          ? (query.status as 'ACTIVE' | 'INACTIVE')
          : undefined,
      page: Number(query.page) || 1,
      pageSize: Number(query.pageSize) || 20,
    }

    const { data: rawEmployees, total, page, pageSize } =
      await workforceRepository.findEmployees(filter)

    const today = new Date().toISOString().slice(0, 10)

    const data = rawEmployees.map((emp) => {
      let currentAllocation = 0
      for (const alloc of emp.allocations || []) {
        if (!alloc.cancelledAt) {
          const s = alloc.startDate.toISOString().slice(0, 10)
          const e = alloc.endDate.toISOString().slice(0, 10)
          if (s <= today && e >= today) {
            currentAllocation += alloc.allocationPercentage
          }
        }
      }

      const cappedAllocation = Math.min(100, Math.max(0, currentAllocation))
      const remainingCapacity = Math.max(0, 100 - cappedAllocation)

      return {
        id: emp.id,
        employeeCode: emp.employeeCode,
        fullName: emp.fullName,
        workEmail: emp.workEmail,
        departmentId: emp.departmentId,
        departmentName: emp.department?.name,
        jobRoleId: emp.jobRoleId,
        jobRoleTitle: emp.jobRole?.name,
        status: emp.status,
        currentAllocation: cappedAllocation,
        currentRemainingCapacity: remainingCapacity,
      }
    })

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    }
  },

  async createEmployee(data: {
    employeeCode: string
    fullName: string
    workEmail: string
    departmentId: string
    jobRoleId: string
    status?: 'ACTIVE' | 'INACTIVE'
  }) {
    return workforceRepository.createEmployee(data)
  },

  async getEmployeeDetail(id: string) {
    const emp = await workforceRepository.findEmployeeById(id)
    if (!emp) {
      throw new NotFoundError('Employee not found.')
    }

    const today = new Date().toISOString().slice(0, 10)

    let currentAllocation = 0
    for (const alloc of emp.allocations || []) {
      if (!alloc.cancelledAt) {
        const s = alloc.startDate.toISOString().slice(0, 10)
        const e = alloc.endDate.toISOString().slice(0, 10)
        if (s <= today && e >= today) {
          currentAllocation += alloc.allocationPercentage
        }
      }
    }

    const cappedAllocation = Math.min(100, Math.max(0, currentAllocation))
    const remainingCapacity = Math.max(0, 100 - cappedAllocation)

    return {
      id: emp.id,
      employeeCode: emp.employeeCode,
      fullName: emp.fullName,
      workEmail: emp.workEmail,
      departmentId: emp.departmentId,
      departmentName: emp.department?.name,
      jobRoleId: emp.jobRoleId,
      jobRoleTitle: emp.jobRole?.name,
      status: emp.status,
      currentAllocation: cappedAllocation,
      currentRemainingCapacity: remainingCapacity,
      skills: (emp.skills || []).map((s) => ({
        id: s.id,
        skillId: s.skillId,
        skillName: s.skill?.name,
        proficiencyLevel: s.proficiencyLevel,
      })),
      allocations: (emp.allocations || []).map((a) => ({
        id: a.id,
        projectId: a.projectId,
        projectName: a.project?.name,
        jobRoleId: a.jobRoleId,
        jobRoleTitle: a.jobRole?.name,
        allocationPercentage: a.allocationPercentage,
        startDate: a.startDate.toISOString().slice(0, 10),
        endDate: a.endDate.toISOString().slice(0, 10),
        cancelledAt: a.cancelledAt ? a.cancelledAt.toISOString() : undefined,
      })),
    }
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
    const existing = await workforceRepository.findEmployeeById(id)
    if (!existing) {
      throw new NotFoundError('Employee not found.')
    }
    return workforceRepository.updateEmployee(id, data)
  },
}
