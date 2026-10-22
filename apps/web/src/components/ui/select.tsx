import React, { forwardRef } from 'react'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string
  error?: string
  helperText?: string
  options: SelectOption[]
  placeholder?: string
}

/**
 * Native `<select>` wrapped in the same label/error/helper structure as
 * `Input`. A native control is deliberate: it keeps keyboard and screen-reader
 * behaviour correct for free and needs no positioning logic for the option list.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, placeholder, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
    const errorId = error ? `${selectId}-error` : undefined

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={`w-full rounded-lg bg-slate-900/80 border ${
            error
              ? 'border-red-500/80 focus:border-red-400 focus:ring-red-500/20'
              : 'border-slate-700/80 focus:border-blue-500 focus:ring-blue-500/20'
          } px-3.5 py-2 text-sm text-slate-100 transition-all focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          {...props}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={errorId} className="text-xs text-red-400 font-medium">
            {error}
          </p>
        )}
        {helperText && !error && <p className="text-xs text-slate-400">{helperText}</p>}
      </div>
    )
  },
)

Select.displayName = 'Select'
