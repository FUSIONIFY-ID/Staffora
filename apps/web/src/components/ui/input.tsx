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
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-[#525252]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-lg bg-white border ${
            error ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-red-500/20' : 'border-[#D4D4D4] focus:border-blue-600 focus:ring-blue-500/20'
          } h-10 px-3.5 text-sm text-[#171717] placeholder-[#A3A3A3] transition-all focus:outline-none focus:ring-2 disabled:opacity-50 ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-[#DC2626] font-medium">{error}</p>}
        {helperText && !error && <p className="text-xs text-[#737373]">{helperText}</p>}
      </div>
    )
  },
)

Input.displayName = 'Input'
