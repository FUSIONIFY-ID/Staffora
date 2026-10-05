import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
})

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12, 'Password must be at least 12 characters'),
  role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'RESOURCE_MANAGER', 'EMPLOYEE']),
  employeeId: z.string().uuid().optional(),
})

export const updateUserSchema = z.object({
  role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'RESOURCE_MANAGER', 'EMPLOYEE']).optional(),
  isActive: z.boolean().optional(),
  employeeId: z.string().uuid().nullable().optional(),
})
