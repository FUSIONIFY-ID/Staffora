import { z } from 'zod'

export const createSkillSchema = z.object({
  name: z.string().min(1, 'Skill name is required').max(255),
})

export const assignSkillSchema = z.object({
  skillId: z.string().uuid('Valid skill ID is required'),
  proficiencyLevel: z.coerce.number().int().min(1).max(5, 'Proficiency level must be between 1 and 5'),
})

export const updateProficiencySchema = z.object({
  proficiencyLevel: z.coerce.number().int().min(1).max(5, 'Proficiency level must be between 1 and 5'),
})
