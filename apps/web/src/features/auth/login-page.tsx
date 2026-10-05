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
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-slate-950">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-blue-600/10 border border-blue-500/20 mb-4 shadow-xl shadow-blue-500/5">
            <img
              src="/logo-icon.png"
              alt="Staffora"
              className="h-12 w-12 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Sign in to Staffora</h1>
          <p className="text-sm text-slate-400 mt-1">Project Resource Allocation & Workforce Planning</p>
        </div>

        {/* Login Form Panel */}
        <div className="glass-panel p-8">
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
              className="w-full"
              isLoading={isLoading}
              disabled={!email || !password || isLoading}
              id="login-submit-button"
            >
              Sign In
            </Button>
          </form>

          {/* Development Quick Role Switcher */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
              Quick Sign-in (Seeded Accounts)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@staffora.internal', 'StafforaAdmin2026!')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-left border border-slate-700/60 transition-colors"
              >
                <div className="font-semibold text-purple-400">Admin</div>
                <div className="text-[10px] text-slate-400 truncate">admin@staffora.internal</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('pm@staffora.internal', 'StafforaPM2026!')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-left border border-slate-700/60 transition-colors"
              >
                <div className="font-semibold text-blue-400">Project Manager</div>
                <div className="text-[10px] text-slate-400 truncate">pm@staffora.internal</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('rm@staffora.internal', 'StafforaRM2026!')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-left border border-slate-700/60 transition-colors"
              >
                <div className="font-semibold text-amber-400">Resource Manager</div>
                <div className="text-[10px] text-slate-400 truncate">rm@staffora.internal</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('employee@staffora.internal', 'StafforaEmp2026!')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-left border border-slate-700/60 transition-colors"
              >
                <div className="font-semibold text-emerald-400">Employee</div>
                <div className="text-[10px] text-slate-400 truncate">employee@staffora.internal</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
