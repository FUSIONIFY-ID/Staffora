import { z } from 'zod'

/**
 * Mirrors the backend login contract (`email` + non-empty `password`). Password strength
 * rules are not checked here: sign-in must not reveal the password policy.
 */
export const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Work email is required.')
    .pipe(z.email('Enter a valid email address.')),
  password: z.string().min(1, 'Password is required.'),
})

export type LoginFormValues = z.infer<typeof loginFormSchema>
