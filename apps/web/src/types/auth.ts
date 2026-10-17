import type { Role } from '../constants/roles.js'

export interface UserEmployee {
  id: string
  employeeCode: string
  fullName: string
  workEmail: string
  departmentId: string
  departmentName: string
  jobRoleId: string
  jobRoleTitle: string
}

export interface UserProfile {
  id: string
  email: string
  role: Role
  isActive: boolean
  employeeId?: string | null
  employee?: UserEmployee | null
}

export interface ApiEnvelope<T> {
  data: T
  meta?: {
    page?: number
    pageSize?: number
    total?: number
    totalPages?: number
    [key: string]: unknown
  }
}
