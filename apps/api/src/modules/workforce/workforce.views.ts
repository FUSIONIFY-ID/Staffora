import { evaluateCapacity, toDateString } from '../capacity/capacity.service.js'
import type { AllocationInterval, CapacityEvaluationResult } from '../capacity/capacity.types.js'
import type { EmployeeStatus } from '../../generated/prisma/client.js'
import type {
  EmployeeDetailRecord,
  EmployeeDetail,
  EmployeeView,
  EmployeeSummaryRecord,
  EmployeeSkillView,
  AvailabilityState,
  CapacityWindow,
} from './workforce.types.js'

interface AllocationLike {
  id: string
  employeeId: string
  allocationPercentage: number
  startDate: Date
  endDate: Date
  cancelledAt: Date | null
}

function toIntervals(allocations: ReadonlyArray<AllocationLike>): AllocationInterval[] {
  return allocations.map((allocation) => ({
    id: allocation.id,
    allocationPercentage: allocation.allocationPercentage,
    startDate: toDateString(allocation.startDate),
    endDate: toDateString(allocation.endDate),
    cancelledAt: allocation.cancelledAt,
  }))
}

/**
 * Capacity effective on a single day, evaluated by the shared sweep-line engine
 * in apps/api/src/modules/capacity (TSD Section 10).
 *
 * PRD US02.01 - AC01.03 asks for a *current* availability indicator, and TSD
 * 10.3 / BR-G17 makes the engine the only place that decides how overlapping
 * allocations combine. Summing percentages anywhere else would be a second
 * implementation of that rule, so the module always asks the engine.
 */
function evaluateDay(
  allocations: ReadonlyArray<AllocationLike>,
  day: string,
): CapacityEvaluationResult {
  return evaluateCapacity(toIntervals(allocations), { startDate: day, endDate: day })
}

/**
 * Maps capacity that is effective today onto the availability states of PRD
 * US05.01 - AC03. Inactive employees are reported NOT_ASSIGNABLE so the list
 * also satisfies US05.01 - AC03.04, which requires inactive employees to be
 * visibly distinguished.
 */
function toAvailabilityState(
  status: EmployeeStatus,
  currentRemainingCapacity: number,
): AvailabilityState {
  if (status !== 'ACTIVE') return 'NOT_ASSIGNABLE'
  if (currentRemainingCapacity <= 0) return 'FULLY_ALLOCATED'
  if (currentRemainingCapacity >= 100) return 'AVAILABLE'
  return 'PARTIAL'
}

export function toEmployeeView(
  employee: EmployeeSummaryRecord,
  referenceDate: string,
): EmployeeView {
  const today = evaluateDay(employee.allocations, referenceDate)

  return {
    id: employee.id,
    employeeCode: employee.employeeCode,
    fullName: employee.fullName,
    workEmail: employee.workEmail,
    status: employee.status,
    currentAllocation: today.peakAllocation,
    currentRemainingCapacity: today.remainingCapacity,
    availability: toAvailabilityState(employee.status, today.remainingCapacity),
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
 * Detail response. The window figures come from the shared engine and are
 * reported once, in `evaluatedPeriod`: peak concurrent allocation over the
 * window and the remaining capacity that follows from it. There is deliberately
 * no second, summed figure, because a sum of allocations that overlap the window
 * without overlapping each other is not a workload (TSD 10.3 / BR-G17).
 */
export function toDetailView(
  employee: EmployeeDetailRecord,
  window: CapacityWindow,
  referenceDate: string,
): EmployeeDetail {
  const evaluation = evaluateCapacity(toIntervals(employee.allocations), {
    startDate: window.startDate,
    endDate: window.endDate,
  })

  return {
    ...toEmployeeView(employee, referenceDate),
    department: { id: employee.department.id, name: employee.department.name },
    jobRole: { id: employee.jobRole.id, name: employee.jobRole.name },
    skills: employee.skills.map(toSkillView),
    allocations: employee.allocations.map((allocation) => ({
      id: allocation.id,
      employeeId: allocation.employeeId,
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
    evaluatedPeriod: {
      startDate: window.startDate,
      endDate: window.endDate,
      peakConcurrentAllocation: evaluation.peakAllocation,
      remainingCapacity: evaluation.remainingCapacity,
    },
  }
}
