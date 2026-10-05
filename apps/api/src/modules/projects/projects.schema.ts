import { z } from 'zod'

export const createProjectSchema = z
  .object({
    projectCode: z.string().min(1, 'Project code is required').max(50),
    name: z.string().min(1, 'Project name is required').max(255),
    projectManagerEmployeeId: z.string().uuid().optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
    status: z.enum(['DRAFT', 'PLANNED', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).default('DRAFT'),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date must be on or after start date.',
    path: ['endDate'],
  })

export const updateProjectSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    projectManagerEmployeeId: z.string().uuid().optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    status: z.enum(['DRAFT', 'PLANNED', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate
      }
      return true
    },
    {
      message: 'End date must be on or after start date.',
      path: ['endDate'],
    },
  )

export const queryProjectsSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['DRAFT', 'PLANNED', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
  projectManagerEmployeeId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
