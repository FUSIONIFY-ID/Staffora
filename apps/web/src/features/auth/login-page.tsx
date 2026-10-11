import React from 'react'
import { useLocation } from 'react-router'
import { Alert } from '../../components/ui/alert.js'
import { readRedirectFrom } from '../../app/router/redirect.js'
import { LoginForm } from './login-form.js'

export const LoginPage: React.FC = () => {
  const location = useLocation()
  const wasRedirected = readRedirectFrom(location.state) !== null

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
        <div className="glass-panel p-8 space-y-6">
          {wasRedirected && <Alert type="info">Please sign in to continue.</Alert>}
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
