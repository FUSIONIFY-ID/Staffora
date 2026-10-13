import type { Prisma } from '../../generated/prisma/client.js'
import { employeeDetailInclude, employeeSummaryInclude } from './workforce.repository.js'

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
 */
export interface EmployeeView {
  id: string
  employeeCode: string
  fullName: string
  workEmail: string
  status: string
  /** Allocation effective today, per PRD US02.01 - AC01.03. */
  currentAllocation: number
  /** 100 minus currentAllocation, floored at 0. */
  currentRemainingCapacity: number
  availability: AvailabilityState
  departmentId: string
  departmentName: string
  jobRoleId: string
  jobRoleTitle: string
  createdAt: string
  updatedAt: string
}

export interface EmployeeSkillView {
  id: string
  skillId: string
  skillName: string
  skillIsActive: boolean
  proficiencyLevel: number
}

export interface EmployeeAllocationView {
  id: string
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

export interface EmployeeCapacitySummary {
  evaluatedPeriod: CapacityWindow
  activeAllocation: number
  peakConcurrentAllocation: number
  remainingCapacity: number
  hasCapacityConflict: boolean
}

/** Detail response. Mirrors `EmployeeDetail` in docs/api/openapi.yaml. */
export interface EmployeeDetail extends EmployeeView {
  department: { id: string; name: string }
  jobRole: { id: string; name: string }
  skills: EmployeeSkillView[]
  allocations: EmployeeAllocationView[]
  evaluatedPeriod: CapacityWindow & {
    peakConcurrentAllocation: number
    remainingCapacity: number
  }
  capacitySummary: EmployeeCapacitySummary
}
