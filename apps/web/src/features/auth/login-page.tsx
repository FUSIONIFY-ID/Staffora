import React from 'react'
import { useLocation } from 'react-router'
import { readRedirectFrom } from '../../app/router/redirect.js'
import { LoginBrandPanel } from './login-brand-panel.js'
import { LoginForm } from './login-form.js'

export const LoginPage: React.FC = () => {
  const location = useLocation()
  const wasRedirected = readRedirectFrom(location.state) !== null

  return (
    <div className="grid min-h-screen grid-cols-1 bg-auth-surface font-brand lg:grid-cols-[minmax(0,680px)_1fr]">
      <LoginBrandPanel />

      <main className="flex items-start justify-center px-4 py-10 sm:px-6 lg:items-center lg:py-12">
        <div className="w-full max-w-[420px] rounded-xl border border-slate-200 bg-white px-6 py-9 shadow-sm sm:px-9">
          <h1 className="text-[28px] font-bold leading-tight text-slate-900">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-500">Sign in to continue to Staffora</p>

          {wasRedirected && (
            <p role="status" className="mt-6 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm text-blue-800">
              Please sign in to continue.
            </p>
          )}

          <div className="mt-8">
            <LoginForm />
          </div>

          <p className="mt-10 text-center text-xs text-slate-400">
            Internal company application · Authorized users only
          </p>
        </div>
      </main>
    </div>
  )
}
