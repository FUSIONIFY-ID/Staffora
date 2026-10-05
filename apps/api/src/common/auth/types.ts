/* eslint-disable @typescript-eslint/no-namespace */
export type Role = 'ADMIN' | 'PROJECT_MANAGER' | 'RESOURCE_MANAGER' | 'EMPLOYEE'

export interface AuthenticatedUser {
  id: string
  email: string
  role: Role
  isActive: boolean
  employeeId?: string | null
  employee?: {
    id: string
    employeeCode: string
    fullName: string
    workEmail: string
    departmentId: string
    departmentName: string
    jobRoleId: string
    jobRoleTitle: string
  } | null
}

declare module 'express-session' {
  interface SessionData {
    userId?: string
    csrfToken?: string
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser
    }
  }
}
