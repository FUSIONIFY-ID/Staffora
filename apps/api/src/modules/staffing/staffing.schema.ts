import { z } from "zod";

/**
 * F2: a requirement cannot reference the same skill twice. The refinement sits
 * on the array itself, so the issue path is `skills` and the API answers
 * `errors.skills`; the per-item shape is untouched. This is plain field
 * validation and lands as 422 `UNPROCESSABLE_ENTITY` — no custom code is added
 * here, because the coded `SKILL_REFERENCE_INVALID` case is raised by the
 * service, which is also the only layer that can see ids that do not exist.
 */
const requirementSkillsSchema = z
  .array(
    z.object({
      skillId: z.string().uuid(),
      minimumProficiencyLevel: z.coerce.number().int().min(1).max(5),
    }),
  )
  .superRefine((skills, context) => {
    const seen = new Set<string>();
    for (const { skillId } of skills) {
      if (seen.has(skillId)) {
        // One issue is enough: repeating the message per duplicate occurrence
        // would just pad `errors.skills` with identical strings.
        context.addIssue({
          code: "custom",
          path: [],
          message: "The same skill cannot be referenced twice.",
        });
        return;
      }
      seen.add(skillId);
    }
  })
  .optional();

export const createStaffingRequirementSchema = z.object({
  jobRoleId: z.string().uuid("Valid job role ID is required"),
  headcount: z.coerce.number().int().min(1, "Headcount must be at least 1"),
  allocationPercentage: z.coerce
    .number()
    .int()
    .min(1)
    .max(100, "Allocation percentage must be between 1 and 100"),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be YYYY-MM-DD"),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be YYYY-MM-DD"),
  skills: requirementSkillsSchema,
});

export const updateStaffingRequirementSchema = z.object({
  jobRoleId: z.string().uuid().optional(),
  headcount: z.coerce.number().int().min(1).optional(),
  allocationPercentage: z.coerce.number().int().min(1).max(100).optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  skills: requirementSkillsSchema,
});

export type CreateStaffingRequirementInput = z.infer<
  typeof createStaffingRequirementSchema
>;
export type UpdateStaffingRequirementInput = z.infer<
  typeof updateStaffingRequirementSchema
>;
