import React from 'react'
import { cn } from '../../lib/utils.js'

export interface PageHeaderProps {
  title: string
  description?: React.ReactNode
  /** Small label rendered above the title, e.g. a breadcrumb or entity code. */
  eyebrow?: React.ReactNode
  /** Page-level actions such as "Create project". Wraps below the title on narrow viewports. */
  actions?: React.ReactNode
  className?: string
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  eyebrow,
  actions,
  className,
}) => {
  return (
    <header
      className={cn(
        'mb-6 flex flex-col gap-4 border-b border-slate-800/80 pb-5 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        {eyebrow && (
          <div className="text-xs font-semibold uppercase tracking-wider text-blue-400">{eyebrow}</div>
        )}
        <h1 className="truncate text-2xl font-bold tracking-tight text-slate-100">{title}</h1>
        {description && <p className="max-w-3xl text-sm leading-relaxed text-slate-400">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}
