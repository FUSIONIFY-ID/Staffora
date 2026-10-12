import { evaluateCapacity, toDateString } from '../capacity/capacity.service.js'
import type { AllocationInterval } from '../capacity/capacity.types.js'
import type { EmployeeDetailRecord, EmployeeSkillView } from './workforce.types.js'
import type { EmployeeSummaryRecord } from './workforce.types.js'

export interface EmployeeView {
  id: string
  employeeCode: string
  fullName: string
  workEmail: string
  status: string
  departmentId: string
  departmentName: string
  jobRoleId: string
  jobRoleTitle: string
  createdAt: string
  updatedAt: string
}

export function toEmployeeView(employee: EmployeeSummaryRecord): EmployeeView {
  return {
    id: employee.id,
    employeeCode: employee.employeeCode,
    fullName: employee.fullName,
    workEmail: employee.workEmail,
    status: employee.status,
    departmentId: employee.departmentId,
    departmentName: employee.department.name,
    jobRoleId: employee.jobRoleId,
    jobRoleTitle: employee.jobRole.name,
    createdAt: employee.createdAt.toISOString(),
    updatedAt: employee.updatedAt.toISOString(),
  }
}

function toSkillView(entry: EmployeeDetailRecord['skills'][number]): EmployeeSkillView {
  return {
    id: entry.id,
    skillId: entry.skillId,
    skillName: entry.skill.name,
    skillIsActive: entry.skill.isActive,
    proficiencyLevel: entry.proficiencyLevel,
  }
}

function resolveAllocationDisplayStatus(
  allocation: { cancelledAt: Date | null; startDate: Date; endDate: Date },
  referenceDate: string,
): 'PLANNED' | 'ACTIVE' | 'ENDED' | 'CANCELLED' {
  if (allocation.cancelledAt) return 'CANCELLED'
  if (toDateString(allocation.startDate) > referenceDate) return 'PLANNED'
  if (toDateString(allocation.endDate) < referenceDate) return 'ENDED'
  return 'ACTIVE'
}

/**
 * Summarises an employee's capacity using the shared capacity engine
 * (apps/api/src/modules/capacity), evaluated from today until the latest
 * known allocation end date.
 */
export function summarizeCapacity(allocations: EmployeeDetailRecord['allocations']) {
  const intervals: AllocationInterval[] = allocations.map((allocation) => ({
    id: allocation.id,
    allocationPercentage: allocation.allocationPercentage,
    startDate: toDateString(allocation.startDate),
    endDate: toDateString(allocation.endDate),
    cancelledAt: allocation.cancelledAt,
  }))

  const referenceDate = toDateString(new Date())
  const horizonEnd = intervals.map((interval) => interval.endDate).sort((a, b) => b.localeCompare(a))[0]
  const evaluation = evaluateCapacity(intervals, {
    startDate: referenceDate,
    endDate: horizonEnd && horizonEnd > referenceDate ? horizonEnd : referenceDate,
  })

  const activeAllocation = intervals
    .filter((interval) => interval.cancelledAt === null && interval.startDate <= referenceDate && interval.endDate >= referenceDate)
    .reduce((sum, interval) => sum + interval.allocationPercentage, 0)

  return {
    evaluatedPeriod: {
      startDate: referenceDate,
      endDate: horizonEnd && horizonEnd > referenceDate ? horizonEnd : referenceDate,
    },
    activeAllocation,
    peakConcurrentAllocation: evaluation.peakAllocation,
    remainingCapacity: evaluation.remainingCapacity,
    hasCapacityConflict: evaluation.hasConflict,
  }
}

export function toDetailView(employee: EmployeeDetailRecord) {
  const referenceDate = toDateString(new Date())

  return {
    ...toEmployeeView(employee),
    department: { id: employee.department.id, name: employee.department.name },
    jobRole: { id: employee.jobRole.id, name: employee.jobRole.name },
    skills: employee.skills.map(toSkillView),
    allocations: employee.allocations.map((allocation) => ({
      id: allocation.id,
      projectId: allocation.projectId,
      projectCode: allocation.project.projectCode,
      projectName: allocation.project.name,
      jobRoleId: allocation.jobRoleId,
      jobRoleTitle: allocation.jobRole.name,
      allocationPercentage: allocation.allocationPercentage,
      startDate: toDateString(allocation.startDate),
      endDate: toDateString(allocation.endDate),
      displayStatus: resolveAllocationDisplayStatus(allocation, referenceDate),
      cancelledAt: allocation.cancelledAt ? allocation.cancelledAt.toISOString() : null,
    })),
    capacitySummary: summarizeCapacity(employee.allocations),
  }
}
