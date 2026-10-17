import { z } from 'zod'

const envSchema = z.object({
  VITE_API_BASE_URL: z
    .string()
    .min(1, 'VITE_API_BASE_URL must not be empty')
    .default('/api/v1'),
})

export type EnvConfig = z.infer<typeof envSchema>

export function validateEnv(rawEnv: Record<string, unknown> = import.meta.env): EnvConfig {
  const result = envSchema.safeParse(rawEnv)

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')

    const message = `[Staffora Environment Validation Error]: Invalid environment configuration:\n${errorDetails}\nPlease check your .env or .env.example file.`

    if (typeof console !== 'undefined' && console.error) {
      console.error(message)
    }

    throw new Error(message)
  }

  return result.data
}

export const env: EnvConfig = validateEnv()
