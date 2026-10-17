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
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-lg bg-surface-white border ${
            error
              ? 'border-danger focus:border-danger focus:ring-danger/20'
              : 'border-line-input focus:border-primary focus:ring-primary/20'
          } h-10 px-3.5 text-sm text-ink placeholder-ink-placeholder transition-all focus:outline-none focus:ring-2 disabled:opacity-50 ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-danger font-medium">{error}</p>}
        {helperText && !error && <p className="text-xs text-ink-dim">{helperText}</p>}
      </div>
    )
  },
)

Input.displayName = 'Input'
