export interface DepartmentItem {
  id: string
  name: string
  isActive?: boolean
}

export interface JobRoleItem {
  id: string
  name: string
  isActive?: boolean
}

export interface ResourceItem {
  id: string
  employeeCode: string
  fullName: string
  workEmail: string
  departmentId: string
  departmentName?: string
  jobRoleId: string
  jobRoleTitle?: string
  status: 'ACTIVE' | 'INACTIVE'
  currentAllocation: number
  currentRemainingCapacity: number
}

export interface ResourceSkillItem {
  id: string
  skillId: string
  skillName: string
  proficiencyLevel: number
}

export interface ResourceAllocationItem {
  id: string
  projectId: string
  projectName?: string
  jobRoleId: string
  jobRoleTitle?: string
  allocationPercentage: number
  startDate: string
  endDate: string
  status?: string
  cancelledAt?: string | null
}

export interface EvaluatedCapacity {
  startDate?: string
  endDate?: string
  peakConcurrentAllocation?: number
  remainingCapacity?: number
}

export interface ResourceDetailItem extends ResourceItem {
  skills?: ResourceSkillItem[]
  allocations?: ResourceAllocationItem[]
  evaluatedPeriod?: EvaluatedCapacity
}

export interface ResourceFiltersState {
  search: string
  departmentId: string
  jobRoleId: string
  status: 'ALL' | 'ACTIVE' | 'INACTIVE'
  page: number
  pageSize: number
}

export interface PaginationMetadata {
  page: number
  pageSize: number
  total: number
  totalPages?: number
}
