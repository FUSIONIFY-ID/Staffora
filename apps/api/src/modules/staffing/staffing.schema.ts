import { z } from 'zod'

export const createStaffingRequirementSchema = z.object({
  jobRoleId: z.string().uuid('Valid job role ID is required'),
  headcount: z.coerce.number().int().min(1, 'Headcount must be at least 1'),
  allocationPercentage: z.coerce.number().int().min(1).max(100, 'Allocation percentage must be between 1 and 100'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
  skills: z
    .array(
      z.object({
        skillId: z.string().uuid(),
        minimumProficiencyLevel: z.coerce.number().int().min(1).max(5),
      }),
    )
    .optional(),
})

export const updateStaffingRequirementSchema = z.object({
  jobRoleId: z.string().uuid().optional(),
  headcount: z.coerce.number().int().min(1).optional(),
  allocationPercentage: z.coerce.number().int().min(1).max(100).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  skills: z
    .array(
      z.object({
        skillId: z.string().uuid(),
        minimumProficiencyLevel: z.coerce.number().int().min(1).max(5),
      }),
    )
    .optional(),
})
