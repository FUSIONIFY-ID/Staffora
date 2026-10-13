import { evaluateCapacity, toDateString } from '../capacity/capacity.service.js'
import type { AllocationInterval } from '../capacity/capacity.types.js'
import type {
  EmployeeDetailRecord,
  EmployeeDetail,
  EmployeeView,
  EmployeeSummaryRecord,
  EmployeeCapacitySummary,
  EmployeeSkillView,
  AvailabilityState,
  CapacityWindow,
} from './workforce.types.js'

export type { AvailabilityState } from './workforce.types.js'

interface AllocationLike {
  id: string
  allocationPercentage: number
  startDate: Date
  endDate: Date
  cancelledAt: Date | null
}

/**
 * Allocation that is effective today: not cancelled, and today falls inside the
 * inclusive start/end range.
 *
 * PRD US02.01 - AC01.03 asks for a *current* availability indicator, so this is
 * the figure the list must show. The window peak computed by
 * evaluateCapacityWindow is a separate, forward-looking figure used by the
 * detail view (AC04.04) and must not drive the list indicator.
 */
export function computeCurrentAllocation(
  allocations: ReadonlyArray<AllocationLike>,
  referenceDate: string,
): number {
  return allocations
    .filter(
      (allocation) =>
        allocation.cancelledAt === null &&
        toDateString(allocation.startDate) <= referenceDate &&
        toDateString(allocation.endDate) >= referenceDate,
    )
    .reduce((sum, allocation) => sum + allocation.allocationPercentage, 0)
}

/**
 * Maps capacity that is effective today onto the availability states of PRD
 * US05.01 - AC03. Inactive employees are reported NOT_ASSIGNABLE so the list
 * also satisfies US05.01 - AC03.04, which requires inactive employees to be
 * visibly distinguished.
 */
export function toAvailabilityState(status: string, currentRemainingCapacity: number): AvailabilityState {
  if (status !== 'ACTIVE') return 'NOT_ASSIGNABLE'
  if (currentRemainingCapacity <= 0) return 'FULLY_ALLOCATED'
  if (currentRemainingCapacity >= 100) return 'AVAILABLE'
  return 'PARTIAL'
}

export function toEmployeeView(employee: EmployeeSummaryRecord, referenceDate: string): EmployeeView {
  const currentAllocation = computeCurrentAllocation(employee.allocations, referenceDate)
  const currentRemainingCapacity = Math.max(0, 100 - currentAllocation)

  return {
    id: employee.id,
    employeeCode: employee.employeeCode,
    fullName: employee.fullName,
    workEmail: employee.workEmail,
    status: employee.status,
    currentAllocation,
    currentRemainingCapacity,
    availability: toAvailabilityState(employee.status, currentRemainingCapacity),
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
 * Sweep-line evaluation of capacity over an explicit window, using the shared
 * engine in apps/api/src/modules/capacity (TSD Section 10). This is the
 * forward-looking figure required by PRD US02.01 - AC04.04.
 */
export function evaluateCapacityWindow(
  allocations: ReadonlyArray<AllocationLike>,
  window: CapacityWindow,
): EmployeeCapacitySummary {
  const intervals: AllocationInterval[] = allocations.map((allocation) => ({
    id: allocation.id,
    allocationPercentage: allocation.allocationPercentage,
    startDate: toDateString(allocation.startDate),
    endDate: toDateString(allocation.endDate),
    cancelledAt: allocation.cancelledAt,
  }))

  const evaluation = evaluateCapacity(intervals, {
    startDate: window.startDate,
    endDate: window.endDate,
  })

  const activeAllocation = intervals
    .filter(
      (interval) =>
        interval.cancelledAt === null &&
        interval.startDate <= window.endDate &&
        interval.endDate >= window.startDate,
    )
    .reduce((sum, interval) => sum + interval.allocationPercentage, 0)

  return {
    evaluatedPeriod: { startDate: window.startDate, endDate: window.endDate },
    activeAllocation,
    peakConcurrentAllocation: evaluation.peakAllocation,
    remainingCapacity: evaluation.remainingCapacity,
    hasCapacityConflict: evaluation.hasConflict,
  }
}

export function toDetailView(employee: EmployeeDetailRecord, window: CapacityWindow): EmployeeDetail {
  const referenceDate = toDateString(new Date())
  const capacitySummary = evaluateCapacityWindow(employee.allocations, window)

  return {
    ...toEmployeeView(employee, referenceDate),
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
    // Retained from the approved contract in dev: the window result at the top
    // level. capacitySummary carries the same window plus the extra
    // activeAllocation and hasCapacityConflict fields.
    evaluatedPeriod: {
      startDate: capacitySummary.evaluatedPeriod.startDate,
      endDate: capacitySummary.evaluatedPeriod.endDate,
      peakConcurrentAllocation: capacitySummary.peakConcurrentAllocation,
      remainingCapacity: capacitySummary.remainingCapacity,
    },
    capacitySummary,
  }
}
