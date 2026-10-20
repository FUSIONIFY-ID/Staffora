import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../../app/providers/auth-provider.js";
import { homePathForRole } from "../../app/navigation/nav-config.js";
import { readRedirectFrom } from "../../app/router/redirect.js";
import { Button } from "../../components/ui/button.js";
import { Input } from "../../components/ui/input.js";
import { Alert } from "../../components/ui/alert.js";
import { getLoginErrorMessage } from "./login-error.js";
import { loginFormSchema, type LoginFormValues } from "./schemas.js";

/**
 * Login screen, per design frame 01: a 680px brand panel on #111827 and a 420px
 * auth card.
 *
 * The brand panel renders the product name and tagline as text. The design uses
 * text here, and the previous raster logo carried an opaque white background
 * that showed as a white box against the dark panel.
 *
 * There is no quick sign-in control. An earlier revision kept one with the
 * seeded account passwords written into the source, which shipped them inside
 * the production bundle. Seeded credentials belong in the environment, not in a
 * client build.
 */
export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = readRedirectFrom(location.state);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useMutation({
    mutationFn: (values: LoginFormValues) =>
      login(values.email, values.password),
    onSuccess: (user) => {
      navigate(redirectTo ?? homePathForRole(user.role), { replace: true });
    },
  });
  const isSubmitting = loginMutation.isPending;

  return (
    <div className="min-h-screen flex bg-surface-page">
      {/* Brand Panel */}
      <aside className="hidden lg:flex w-[680px] shrink-0 flex-col justify-center bg-surface-brand-panel px-16">
        <p className="text-2xl font-semibold text-white">Staffora</p>
        <p className="mt-4 text-lg text-white/70">
          Right People. Right Project.
        </p>
      </aside>

      {/* Auth Card */}
      <div className="flex-1 min-w-0 flex flex-col justify-center items-center px-4 py-10">
        <div className="w-full max-w-[420px] bg-surface-white border border-line rounded-[14px] p-8">
          {/* Brand Header */}
          <div className="mb-8">
            <h1 className="text-[28px] font-semibold leading-[41px] text-ink">
              Welcome back
            </h1>
            <p className="text-sm text-ink-muted mt-1">
              Sign in to continue to Staffora
            </p>
          </div>

          {/* Login Form Panel */}
          <div>
            {redirectTo && (
              <Alert type="info" className="mb-6">
                Please sign in to continue.
              </Alert>
            )}
            {loginMutation.isError && (
              <Alert type="error" className="mb-6">
                {getLoginErrorMessage(loginMutation.error)}
              </Alert>
            )}

            <form
              onSubmit={handleSubmit((values) => loginMutation.mutate(values))}
              className="space-y-5"
              noValidate
              aria-busy={isSubmitting}
            >
              <Input
                {...register("email")}
                label="Work Email"
                type="email"
                placeholder="you@company.com"
                autoComplete="username"
                autoFocus
                disabled={isSubmitting}
                error={errors.email?.message}
                aria-invalid={errors.email ? true : undefined}
                id="login-email"
              />

              <Input
                {...register("password")}
                label="Password"
                type="password"
                placeholder="••••••••••••"
                autoComplete="current-password"
                disabled={isSubmitting}
                error={errors.password?.message}
                aria-invalid={errors.password ? true : undefined}
                id="login-password"
              />

              <Button
                type="submit"
                className="w-full h-12"
                isLoading={isSubmitting}
                disabled={isSubmitting}
                id="login-submit-button"
              >
                Sign In
              </Button>
            </form>

            <p className="mt-8 pt-6 border-t border-line text-center text-xs text-ink-dim">
              Internal company application &middot; Authorized users only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
