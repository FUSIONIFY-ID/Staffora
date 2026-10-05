import { z } from 'zod'

export const resourceFinderQuerySchema = z
  .object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
    jobRoleId: z.string().uuid().optional(),
    departmentId: z.string().uuid().optional(),
    skillId: z.string().uuid().optional(),
    minProficiency: z.coerce.number().int().min(1).max(5).optional(),
    minRemainingCapacity: z.coerce.number().int().min(0).max(100).optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date must be on or after start date.',
    path: ['endDate'],
  })
