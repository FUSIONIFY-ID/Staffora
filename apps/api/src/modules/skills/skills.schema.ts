import { z } from "zod";

/**
 * Skill names are normalised before storage: trimmed and with internal
 * whitespace collapsed. Uniqueness is enforced case-insensitively by the
 * database through `skills_name_key` and `skills_name_lower_key` (migration
 * 20261018120000_skills_normalized_name_uniqueness), so the service compares
 * with `mode: "insensitive"` and never re-implements the rule.
 *
 * The same helper style is used by workforce.schema.ts for departments and job
 * roles.
 */
const normalizedName = (label: string): z.ZodType<string> =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(255)
    .transform((value) => value.replace(/\s+/g, " "));

/** AC01.01 / AC01.02: a skill needs a non-empty name. */
export const createSkillSchema = z.object({
  name: normalizedName("Skill name"),
});

/** AC01.04: rename and/or toggle Active. At least one field is required. */
export const updateSkillSchema = z
  .object({
    name: normalizedName("Skill name").optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided.",
  });

/**
 * AC02.01 / AC02.02 / BR01: the body is JSON, so the proficiency level must
 * already be a number. `z.coerce` would silently accept `"3"` from a JSON
 * string and is deliberately not used.
 */
const proficiencyLevelSchema = z
  .number()
  .int()
  .min(1, "Proficiency level must be between 1 and 5")
  .max(5, "Proficiency level must be between 1 and 5");

export const assignSkillSchema = z.object({
  skillId: z.uuid("Valid skill ID is required"),
  proficiencyLevel: proficiencyLevelSchema,
});

export const updateProficiencySchema = z.object({
  proficiencyLevel: proficiencyLevelSchema,
});

/**
 * Query strings arrive as strings, so `isActive` accepts the `"true"` /
 * `"false"` forms and yields a boolean. The boolean branch keeps the schema
 * idempotent: the controller re-parses the value that `validateQuery` already
 * wrote back onto `req.query`, and that value is a boolean by then.
 */
export const listSkillsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().optional(),
  isActive: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((value) => (typeof value === "boolean" ? value : value === "true"))
    .optional(),
});

/**
 * TSD 11.1: a list response is paginated even when the caller does not ask for
 * it, with page defaulting to 1, pageSize to 20 and pageSize capped at 100.
 * The employee skill list uses the same bounds as the catalog.
 */
export const listEmployeeSkillsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const skillIdParamsSchema = z.object({
  id: z.uuid("Invalid UUID format."),
});

export const employeeSkillParamsSchema = z.object({
  id: z.uuid("Invalid UUID format."),
  skillId: z.uuid("Invalid UUID format."),
});

export const employeeIdParamsSchema = z.object({
  id: z.uuid("Invalid UUID format."),
});

export type CreateSkillInput = z.infer<typeof createSkillSchema>;
export type UpdateSkillInput = z.infer<typeof updateSkillSchema>;
export type AssignSkillInput = z.infer<typeof assignSkillSchema>;
export type UpdateProficiencyInput = z.infer<typeof updateProficiencySchema>;
export type SkillListQuery = z.infer<typeof listSkillsQuerySchema>;
export type EmployeeSkillListQuery = z.infer<
  typeof listEmployeeSkillsQuerySchema
>;
