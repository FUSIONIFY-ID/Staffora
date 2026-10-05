import { z } from 'zod'

export const createAllocationSchema = z
  .object({
    employeeId: z.string().uuid('Valid employee ID is required'),
    projectId: z.string().uuid('Valid project ID is required'),
    jobRoleId: z.string().uuid('Valid job role ID is required'),
    staffingRequirementId: z.string().uuid().nullable().optional(),
    allocationPercentage: z
      .coerce
      .number()
      .int()
      .min(1, 'Allocation percentage must be at least 1')
      .max(100, 'Allocation percentage cannot exceed 100'),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date must be on or after start date.',
    path: ['endDate'],
  })

export const updateAllocationSchema = z
  .object({
    jobRoleId: z.string().uuid().optional(),
    allocationPercentage: z.coerce.number().int().min(1).max(100).optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
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

export const endAllocationSchema = z.object({
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
})
