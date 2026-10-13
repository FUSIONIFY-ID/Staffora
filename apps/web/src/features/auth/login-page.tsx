import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../app/providers/auth-provider.js'
import { Button } from '../../components/ui/button.js'
import { Input } from '../../components/ui/input.js'
import { Alert } from '../../components/ui/alert.js'

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setError(null)
    setIsLoading(true)

    try {
      const user = await login(email, password)
      if (user.role === 'EMPLOYEE') {
        navigate('/my-profile')
      } else {
        navigate('/dashboard')
      }
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Invalid email or password.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail)
    setPassword(demoPass)
  }

  return (
    <div className="min-h-screen flex bg-[#F7F8FA]">
      {/* Brand Panel */}
      <aside className="hidden lg:flex w-[680px] shrink-0 flex-col justify-center bg-[#111827] px-16">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Staffora"
            className="h-9 w-auto object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
          <span className="text-2xl font-semibold text-white">Staffora</span>
        </div>
        <p className="mt-4 text-lg text-white/70">Right People. Right Project.</p>
      </aside>

      {/* Auth Card */}
      <div className="flex-1 min-w-0 flex flex-col justify-center items-center px-4 py-10">
        <div className="w-full max-w-[420px] bg-white border border-[#E5E7EB] rounded-[14px] p-8">
          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className="lg:hidden inline-flex items-center justify-center p-3 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] mb-4">
              <img
                src="/logo-icon.png"
                alt="Staffora"
                className="h-12 w-12 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#171717]">Sign in to Staffora</h1>
            <p className="text-sm text-[#525252] mt-1">Project Resource Allocation &amp; Workforce Planning</p>
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

            {/* Development Quick Role Switcher */}
            <div className="mt-8 pt-6 border-t border-[#E5E7EB]">
              <p className="text-xs font-semibold text-[#525252] uppercase tracking-wider mb-3 text-center">
                Quick Sign-in (Seeded Accounts)
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@staffora.internal', 'StafforaAdmin2026!')}
                  className="px-2.5 py-1.5 rounded-lg bg-[#F5F5F5] hover:bg-[#E5E7EB] text-[#171717] text-left border border-[#E5E7EB] transition-colors"
                >
                  <div className="font-semibold text-[#1D4ED8]">Admin</div>
                  <div className="text-[10px] text-[#737373] truncate">admin@staffora.internal</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('pm@staffora.internal', 'StafforaPM2026!')}
                  className="px-2.5 py-1.5 rounded-lg bg-[#F5F5F5] hover:bg-[#E5E7EB] text-[#171717] text-left border border-[#E5E7EB] transition-colors"
                >
                  <div className="font-semibold text-[#1D4ED8]">Project Manager</div>
                  <div className="text-[10px] text-[#737373] truncate">pm@staffora.internal</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('rm@staffora.internal', 'StafforaRM2026!')}
                  className="px-2.5 py-1.5 rounded-lg bg-[#F5F5F5] hover:bg-[#E5E7EB] text-[#171717] text-left border border-[#E5E7EB] transition-colors"
                >
                  <div className="font-semibold text-[#B45309]">Resource Manager</div>
                  <div className="text-[10px] text-[#737373] truncate">rm@staffora.internal</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('employee@staffora.internal', 'StafforaEmp2026!')}
                  className="px-2.5 py-1.5 rounded-lg bg-[#F5F5F5] hover:bg-[#E5E7EB] text-[#171717] text-left border border-[#E5E7EB] transition-colors"
                >
                  <div className="font-semibold text-[#16A34A]">Employee</div>
                  <div className="text-[10px] text-[#737373] truncate">employee@staffora.internal</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
