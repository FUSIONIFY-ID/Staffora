import { workforceRepository } from './workforce.repository.js'
import { ConflictError, NotFoundError } from '../../common/errors/app-error.js'
import { evaluateCapacity, toDateString } from '../capacity/capacity.service.js'

export const workforceService = {
  getDepartments() {
    return workforceRepository.findDepartments()
  },

  async createDepartment(name: string, actorId?: string) {
    return workforceRepository.createDepartment(name, actorId)
  },

  getJobRoles() {
    return workforceRepository.findJobRoles()
  },

  async createJobRole(name: string, actorId?: string) {
    return workforceRepository.createJobRole(name, actorId)
  },

  async getEmployees(params: {
    search?: string
    departmentId?: string
    jobRoleId?: string
    status?: 'ACTIVE' | 'INACTIVE'
    page: number
    pageSize: number
  }) {
    const { data, total } = await workforceRepository.findEmployees(params)
    const today = toDateString(new Date())

    const mapped = data.map((emp) => {
      // Calculate today's concurrent allocation for employee list indicator
      const activeAllocations = emp.allocations.map((a) => ({
        id: a.id,
        startDate: toDateString(a.startDate),
        endDate: toDateString(a.endDate),
        allocationPercentage: a.allocationPercentage,
        cancelledAt: a.cancelledAt,
      }))

      const capacity = evaluateCapacity(activeAllocations, {
        startDate: today,
        endDate: today,
      })

      return {
        id: emp.id,
        employeeCode: emp.employeeCode,
        fullName: emp.fullName,
        workEmail: emp.workEmail,
        departmentId: emp.departmentId,
        departmentName: emp.department.name,
        jobRoleId: emp.jobRoleId,
        jobRoleTitle: emp.jobRole.name,
        status: emp.status,
        currentAllocation: capacity.peakAllocation,
        currentRemainingCapacity: capacity.remainingCapacity,
      }
    })

    return {
      data: mapped,
      total,
      page: params.page,
      pageSize: params.pageSize,
    }
  },

  async getEmployeeDetail(id: string, dateRange?: { startDate?: string; endDate?: string }) {
    const emp = await workforceRepository.findEmployeeById(id)
    if (!emp) {
      throw new NotFoundError('Employee not found.')
    }

    const today = toDateString(new Date())
    const evalStart = dateRange?.startDate || today
    const evalEnd = dateRange?.endDate || today

    const activeAllocations = emp.allocations.map((a) => ({
      id: a.id,
      startDate: toDateString(a.startDate),
      endDate: toDateString(a.endDate),
      allocationPercentage: a.allocationPercentage,
      cancelledAt: a.cancelledAt,
    }))

    const capacityEval = evaluateCapacity(activeAllocations, {
      startDate: evalStart,
      endDate: evalEnd,
    })

    const allocationsMapped = emp.allocations.map((a) => {
      const startStr = toDateString(a.startDate)
      const endStr = toDateString(a.endDate)
      let displayStatus = 'ACTIVE'
      if (a.cancelledAt) {
        displayStatus = 'CANCELLED'
      } else if (startStr > today) {
        displayStatus = 'PLANNED'
      } else if (endStr < today) {
        displayStatus = 'ENDED'
      }

      return {
        id: a.id,
        employeeId: a.employeeId,
        employeeName: emp.fullName,
        projectId: a.projectId,
        projectName: a.project.name,
        projectCode: a.project.projectCode,
        jobRoleId: a.jobRoleId,
        jobRoleTitle: a.jobRole.name,
        staffingRequirementId: a.staffingRequirementId,
        allocationPercentage: a.allocationPercentage,
        startDate: startStr,
        endDate: endStr,
        displayStatus,
        cancelledAt: a.cancelledAt,
      }
    })

    return {
      id: emp.id,
      employeeCode: emp.employeeCode,
      fullName: emp.fullName,
      workEmail: emp.workEmail,
      departmentId: emp.departmentId,
      departmentName: emp.department.name,
      jobRoleId: emp.jobRoleId,
      jobRoleTitle: emp.jobRole.name,
      status: emp.status,
      currentAllocation: capacityEval.peakAllocation,
      currentRemainingCapacity: capacityEval.remainingCapacity,
      skills: emp.skills.map((s) => ({
        id: s.id,
        skillId: s.skillId,
        skillName: s.skill.name,
        proficiencyLevel: s.proficiencyLevel,
      })),
      allocations: allocationsMapped,
      evaluatedPeriod: {
        startDate: evalStart,
        endDate: evalEnd,
        peakConcurrentAllocation: capacityEval.peakAllocation,
        remainingCapacity: capacityEval.remainingCapacity,
      },
    }
  },

  async createEmployee(
    input: {
      employeeCode: string
      fullName: string
      workEmail: string
      departmentId: string
      jobRoleId: string
      status: 'ACTIVE' | 'INACTIVE'
    },
    actorId?: string,
  ) {
    const existingCode = await workforceRepository.findEmployeeByCode(input.employeeCode)
    if (existingCode) {
      throw new ConflictError('Employee code already exists.')
    }

    const existingEmail = await workforceRepository.findEmployeeByEmail(input.workEmail)
    if (existingEmail) {
      throw new ConflictError('Work email already exists.')
    }

    const emp = await workforceRepository.createEmployee({
      ...input,
      createdBy: actorId,
    })

    return {
      id: emp.id,
      employeeCode: emp.employeeCode,
      fullName: emp.fullName,
      workEmail: emp.workEmail,
      departmentId: emp.departmentId,
      departmentName: emp.department.name,
      jobRoleId: emp.jobRoleId,
      jobRoleTitle: emp.jobRole.name,
      status: emp.status,
      currentAllocation: 0,
      currentRemainingCapacity: 100,
    }
  },

  async updateEmployee(
    id: string,
    input: {
      fullName?: string
      departmentId?: string
      jobRoleId?: string
      status?: 'ACTIVE' | 'INACTIVE'
    },
    actorId?: string,
  ) {
    const existing = await workforceRepository.findEmployeeById(id)
    if (!existing) {
      throw new NotFoundError('Employee not found.')
    }

    const emp = await workforceRepository.updateEmployee(id, {
      ...input,
      updatedBy: actorId,
    })

    return {
      id: emp.id,
      employeeCode: emp.employeeCode,
      fullName: emp.fullName,
      workEmail: emp.workEmail,
      departmentId: emp.departmentId,
      departmentName: emp.department.name,
      jobRoleId: emp.jobRoleId,
      jobRoleTitle: emp.jobRole.name,
      status: emp.status,
    }
  },
}
