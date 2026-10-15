import React, { forwardRef } from 'react'
import { cn } from '../../lib/utils.js'

export interface AuthFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  error?: string
}

/**
 * Light-surface text field for the login card. The shared `Input` primitive is styled
 * for the dark app shell, so the auth screen keeps its own field to match the design.
 */
export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  ({ id, label, error, className, ...props }, ref) => {
    const errorId = `${id}-error`

    return (
      <div className="space-y-2">
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 placeholder-slate-400 transition-colors',
            'focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
              : 'border-slate-300 focus:border-brand-primary focus:ring-brand-primary/20',
            className,
          )}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-xs font-medium text-red-600">
            {error}
          </p>
        )}
      </div>
    )
  },
)

AuthField.displayName = 'AuthField'
