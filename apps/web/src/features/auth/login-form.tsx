import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '../../app/providers/auth-provider.js'
import { AuthField } from './auth-field.js'
import { getLoginErrorMessage } from './login-error.js'
import { loginFormSchema, type LoginFormValues } from './schemas.js'

/**
 * Sign-in form. On success the auth session is populated and PublicRoute performs the
 * redirect, so this component never navigates by itself.
 */
export const LoginForm: React.FC = () => {
  const { login } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  })

  const loginMutation = useMutation({
    mutationFn: (values: LoginFormValues) => login(values.email, values.password),
  })
  const isSubmitting = loginMutation.isPending

  return (
    <form
      onSubmit={handleSubmit((values) => loginMutation.mutate(values))}
      className="space-y-5"
      noValidate
      aria-busy={isSubmitting}
    >
      {loginMutation.isError && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {getLoginErrorMessage(loginMutation.error)}
        </div>
      )}

      <AuthField
        {...register('email')}
        id="login-email"
        label="Work email"
        type="email"
        autoComplete="username"
        placeholder="you@company.com"
        autoFocus
        disabled={isSubmitting}
        error={errors.email?.message}
      />

      <AuthField
        {...register('password')}
        id="login-password"
        label="Password"
        type="password"
        autoComplete="current-password"
        placeholder="Enter your password"
        disabled={isSubmitting}
        error={errors.password?.message}
      />

      <button
        type="submit"
        id="login-submit-button"
        disabled={isSubmitting}
        className="mt-3 inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand-primary text-sm font-semibold text-white transition-colors hover:bg-brand-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting && (
          <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        )}
        {isSubmitting ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  )
}
