import React from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'

export interface FormSelectProps {
  id: string
  label: string
  options: Array<{ id: string; name: string }>
  placeholder: string
  registration: UseFormRegisterReturn
  disabled?: boolean
  error?: string
}

export const FormSelect: React.FC<FormSelectProps> = ({
  id,
  label,
  options,
  placeholder,
  registration,
  disabled = false,
  error,
}): React.JSX.Element => (
  <div className="w-full space-y-1.5 text-left">
    <label
      htmlFor={id}
      className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
    >
      {label}
    </label>
    <select
      id={id}
      disabled={disabled}
      className={`w-full rounded-lg bg-slate-900/80 border ${
        error ? 'border-red-500' : 'border-slate-700/80'
      } px-3.5 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60`}
      {...registration}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.name}
        </option>
      ))}
    </select>
    {error && <p className="text-xs text-red-400">{error}</p>}
  </div>
)
