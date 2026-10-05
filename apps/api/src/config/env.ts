import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.url().startsWith('postgresql://').optional(),
  SESSION_SECRET: z.string().min(32).optional(),
}).superRefine((value, context) => {
  if (value.NODE_ENV === 'production' && !value.DATABASE_URL) context.addIssue({ code: 'custom', path: ['DATABASE_URL'], message: 'Required in production' })
  if (value.NODE_ENV === 'production' && !value.SESSION_SECRET) context.addIssue({ code: 'custom', path: ['SESSION_SECRET'], message: 'Required in production' })
})

export function loadEnv(source: NodeJS.ProcessEnv = process.env) { return schema.parse(source) }
