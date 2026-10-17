import React, { forwardRef } from 'react'
import { cn } from '../../lib/utils.js'

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  description?: string
  error?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, className, id, ...props }, ref) => {
    const checkboxId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className="flex items-start gap-3 text-left">
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className={cn(
            'h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 transition mt-0.5 cursor-pointer',
            className,
          )}
          {...props}
        />
        {(label || description) && (
          <div className="text-sm">
            {label && (
              <label htmlFor={checkboxId} className="font-medium text-slate-200 cursor-pointer select-none">
                {label}
              </label>
            )}
            {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
            {error && <p className="text-xs text-red-400 mt-0.5 font-medium">{error}</p>}
          </div>
        )}
      </div>
    )
  },
)

Checkbox.displayName = 'Checkbox'
