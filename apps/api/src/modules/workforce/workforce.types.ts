import type { Prisma } from '../../generated/prisma/client.js'
import { employeeDetailInclude, employeeSummaryInclude } from './workforce.repository.js'

export type EmployeeSummaryRecord = Prisma.EmployeeGetPayload<{
  include: typeof employeeSummaryInclude
}>

export type EmployeeDetailRecord = Prisma.EmployeeGetPayload<{
  include: typeof employeeDetailInclude
}>

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
  evaluatedPeriod: {
    startDate: string
    endDate: string
  }
  activeAllocation: number
  peakConcurrentAllocation: number
  remainingCapacity: number
  hasCapacityConflict: boolean
}

export interface EmployeeDetail {
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
  department: { id: string; name: string }
  jobRole: { id: string; name: string }
  skills: EmployeeSkillView[]
  allocations: EmployeeAllocationView[]
  capacitySummary: EmployeeCapacitySummary
}
