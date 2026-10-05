import { z } from 'zod'

export const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required').max(255),
})

export const createJobRoleSchema = z.object({
  name: z.string().min(1, 'Job role title is required').max(255),
})

export const createEmployeeSchema = z.object({
  employeeCode: z.string().min(1, 'Employee code is required').max(50),
  fullName: z.string().min(1, 'Full name is required').max(255),
  workEmail: z.string().email('Valid work email is required'),
  departmentId: z.string().uuid('Valid department ID is required'),
  jobRoleId: z.string().uuid('Valid job role ID is required'),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
})

export const updateEmployeeSchema = z.object({
  fullName: z.string().min(1).max(255).optional(),
  departmentId: z.string().uuid().optional(),
  jobRoleId: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

export const queryEmployeesSchema = z.object({
  search: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  jobRoleId: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
