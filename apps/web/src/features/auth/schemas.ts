import { z } from "zod";

/**
 * Mirrors the backend login contract: an email and a non-empty password. The password
 * policy is not checked here, so the sign-in form never reveals it.
 */
export const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Work email is required.")
    .pipe(z.email("Enter a valid email address.")),
  password: z.string().min(1, "Password is required."),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
