import React from 'react'
import { cn } from '../../lib/utils.js'

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode
  required?: boolean
}

export const Label: React.FC<LabelProps> = ({ children, required, className, ...props }) => {
  return (
    <label
      className={cn(
        'block text-xs font-semibold uppercase tracking-wider text-slate-300 select-none',
        className,
      )}
      {...props}
    >
      {children}
      {required && <span className="text-red-400 ml-1 font-bold">*</span>}
    </label>
  )
}
