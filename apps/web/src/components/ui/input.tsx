import React, { forwardRef } from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-lg bg-slate-900/80 border ${
            error ? 'border-red-500/80 focus:border-red-400 focus:ring-red-500/20' : 'border-slate-700/80 focus:border-blue-500 focus:ring-blue-500/20'
          } px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 transition-all focus:outline-none focus:ring-2 disabled:opacity-50 ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-red-400 font-medium">{error}</p>}
        {helperText && !error && <p className="text-xs text-slate-400">{helperText}</p>}
      </div>
    )
  },
)

Input.displayName = 'Input'
