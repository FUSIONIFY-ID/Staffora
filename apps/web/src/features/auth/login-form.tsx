import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '../../app/providers/auth-provider.js'
import { Alert } from '../../components/ui/alert.js'
import { Button } from '../../components/ui/button.js'
import { Input } from '../../components/ui/input.js'
import { getLoginErrorMessage } from './login-error.js'
import { loginFormSchema, type LoginFormValues } from './schemas.js'

/**
 * Sign-in form. On success the auth session is populated and PublicRoute performs the
 * redirect, so this component never navigates by itself.
 */
export const LoginForm: React.FC = () => {
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
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
      {loginMutation.isError && <Alert type="error">{getLoginErrorMessage(loginMutation.error)}</Alert>}

      <Input
        {...register('email')}
        id="login-email"
        label="Work Email"
        type="email"
        autoComplete="username"
        placeholder="you@company.com"
        autoFocus
        disabled={isSubmitting}
        error={errors.email?.message}
        aria-invalid={Boolean(errors.email)}
      />

      <div className="space-y-2">
        <Input
          {...register('password')}
          id="login-password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="••••••••••••"
          disabled={isSubmitting}
          error={errors.password?.message}
          aria-invalid={Boolean(errors.password)}
        />
        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          aria-pressed={showPassword}
          aria-controls="login-password"
          className="cursor-pointer text-xs font-medium text-slate-400 transition-colors hover:text-slate-200"
        >
          {showPassword ? 'Hide password' : 'Show password'}
        </button>
      </div>

      <Button type="submit" className="w-full" isLoading={isSubmitting} id="login-submit-button">
        {isSubmitting ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  )
}
