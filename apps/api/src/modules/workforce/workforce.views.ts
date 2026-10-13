import { evaluateCapacity, toDateString } from '../capacity/capacity.service.js'
import type { AllocationInterval } from '../capacity/capacity.types.js'
import type { EmployeeDetailRecord, EmployeeCapacitySummary, EmployeeSkillView } from './workforce.types.js'
import type { EmployeeSummaryRecord } from './workforce.types.js'

export interface EmployeeView {
  id: string
  employeeCode: string
  fullName: string
  workEmail: string
  status: string
  availability: AvailabilityState
  remainingCapacity: number
  departmentId: string
  departmentName: string
  jobRoleId: string
  jobRoleTitle: string
  createdAt: string
  updatedAt: string
}

export type AvailabilityState = 'AVAILABLE' | 'PARTIAL' | 'FULLY_ALLOCATED' | 'NOT_ASSIGNABLE'

/**
 * Maps remaining capacity onto the availability states required by PRD US05.01 - AC03.
 * Inactive employees are reported as NOT_ASSIGNABLE so the list can satisfy
 * US02.01 - AC01.03, which requires a current availability indicator, and
 * US05.01 - AC03.04, which requires inactive employees to be visibly distinguished.
 */
export function toAvailabilityState(status: string, remainingCapacity: number): AvailabilityState {
  if (status !== 'ACTIVE') return 'NOT_ASSIGNABLE'
  if (remainingCapacity <= 0) return 'FULLY_ALLOCATED'
  if (remainingCapacity >= 100) return 'AVAILABLE'
  return 'PARTIAL'
}

export function toEmployeeView(
  employee: EmployeeSummaryRecord,
  remainingCapacity: number,
): EmployeeView {
  return {
    id: employee.id,
    employeeCode: employee.employeeCode,
    fullName: employee.fullName,
    workEmail: employee.workEmail,
    status: employee.status,
    availability: toAvailabilityState(employee.status, remainingCapacity),
    remainingCapacity,
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
 * Sweep-line evaluation of remaining capacity from today until the latest known
 * allocation end date, using the shared capacity engine in
 * apps/api/src/modules/capacity (TSD Section 10).
 *
 * Accepts only the fields the engine needs, so the list endpoint can pass its
 * lighter allocation projection while the detail view passes its full records.
 */
export function evaluateRemainingCapacity(
  allocations: ReadonlyArray<{
    id: string
    allocationPercentage: number
    startDate: Date
    endDate: Date
    cancelledAt: Date | null
  }>,
): EmployeeCapacitySummary {
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

/** Employee detail capacity summary, PRD US02.01 - AC04.04. */
export function summarizeCapacity(allocations: EmployeeDetailRecord['allocations']) {
  return evaluateRemainingCapacity(allocations)
}

export function toDetailView(employee: EmployeeDetailRecord) {
  const referenceDate = toDateString(new Date())

  return {
    // AC04.04: show allocation effective today, or peak concurrent allocation
    // and remaining capacity for a selected date range. summarizeCapacity
    // evaluates from today to the latest allocation end date.
    ...toEmployeeView(employee, summarizeCapacity(employee.allocations).remainingCapacity),
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
