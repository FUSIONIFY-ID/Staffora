import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../app/providers/auth-provider.js'
import { homePathForRole } from '../../app/navigation/nav-config.js'
import { Button } from '../../components/ui/button.js'
import { Input } from '../../components/ui/input.js'
import { Alert } from '../../components/ui/alert.js'

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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setError(null)
    setIsLoading(true)

    try {
      const user = await login(email, password)
      navigate(homePathForRole(user.role))
    } catch (err: unknown) {
      setError(err instanceof Error && err.message ? err.message : 'Invalid email or password.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-surface-page">
      {/* Brand Panel */}
      <aside className="hidden lg:flex w-[680px] shrink-0 flex-col justify-center bg-surface-brand-panel px-16">
        <p className="text-2xl font-semibold text-white">Staffora</p>
        <p className="mt-4 text-lg text-white/70">Right People. Right Project.</p>
      </aside>

      {/* Auth Card */}
      <div className="flex-1 min-w-0 flex flex-col justify-center items-center px-4 py-10">
        <div className="w-full max-w-[420px] bg-surface-white border border-line rounded-[14px] p-8">
          {/* Brand Header */}
          <div className="mb-8">
            <h1 className="text-[28px] font-semibold leading-[41px] text-ink">Welcome back</h1>
            <p className="text-sm text-ink-muted mt-1">Sign in to continue to Staffora</p>
          </div>

          {/* Login Form Panel */}
          <div>
            {error && (
              <Alert type="error" className="mb-6">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Work Email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                id="login-email"
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                id="login-password"
              />

              <Button
                type="submit"
                className="w-full h-12"
                isLoading={isLoading}
                disabled={!email || !password || isLoading}
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
  )
}
