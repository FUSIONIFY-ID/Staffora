import type { EmployeeStatus, Prisma } from '../../generated/prisma/client.js'
import type { employeeDetailInclude, employeeSummaryInclude } from './workforce.repository.js'

export type EmployeeSummaryRecord = Prisma.EmployeeGetPayload<{
  include: typeof employeeSummaryInclude
}>

export type EmployeeDetailRecord = Prisma.EmployeeGetPayload<{
  include: typeof employeeDetailInclude
}>

/** Inclusive ISO date window (YYYY-MM-DD) used for a capacity evaluation. */
export interface CapacityWindow {
  startDate: string
  endDate: string
}

export type AvailabilityState = 'AVAILABLE' | 'PARTIAL' | 'FULLY_ALLOCATED' | 'NOT_ASSIGNABLE'

/**
 * Employee row in a list response. Mirrors the `Employee` schema in
 * docs/api/openapi.yaml.
 *
 * The field set stays as close to the contract on `dev` as the acceptance
 * criteria allow. `availability` is the one addition, because US02.01 - AC01.03
 * requires a current availability indicator on every row. See
 * docs/api/contract-changelog.md for the delta against `dev` and the AC behind
 * each entry.
 */
export interface EmployeeView {
  id: string
  employeeCode: string
  fullName: string
  workEmail: string
  status: EmployeeStatus
  /** Peak concurrent allocation effective today, per PRD US02.01 - AC01.03. */
  currentAllocation: number
  /** 100 minus currentAllocation, floored at 0. */
  currentRemainingCapacity: number
  availability: AvailabilityState
  departmentId: string
  departmentName: string
  jobRoleId: string
  jobRoleTitle: string
}

export interface EmployeeSkillView {
  id: string
  skillId: string
  skillName: string
  skillIsActive: boolean
  proficiencyLevel: number
}

/**
 * Allocation row inside an employee detail response. This is the subset of the
 * `Allocation` schema in docs/api/openapi.yaml that an employee profile can
 * fill in, and it keeps the fields that schema requires, `employeeId` among
 * them, so a consumer of the contract on `dev` keeps working.
 */
interface EmployeeAllocationView {
  id: string
  employeeId: string
  projectId: string
  projectCode: string
  projectName: string
  jobRoleId: string
  jobRoleTitle: string
  allocationPercentage: number
  startDate: string
  endDate: string
  displayStatus: 'PLANNED' | 'ACTIVE' | 'ENDED' | 'CANCELLED'
  cancelledAt: string | null
}

/**
 * Detail response. Mirrors `EmployeeDetail` in docs/api/openapi.yaml.
 *
 * `department` and `jobRole` objects were dropped: the ids and the names are
 * already on the row as `departmentId` / `departmentName` and `jobRoleId` /
 * `jobRoleTitle`, so the nested objects repeated the same two values and were
 * not part of the contract on `dev`.
 */
export interface EmployeeDetail extends EmployeeView {
  skills: EmployeeSkillView[]
  allocations: EmployeeAllocationView[]
  evaluatedPeriod: CapacityWindow & {
    peakConcurrentAllocation: number
    remainingCapacity: number
  }
}
