import React from 'react'
import { Button } from '../ui/button.js'
import { cn } from '../../lib/utils.js'

export interface FilterBarProps {
  /** Filter controls (SearchInput, Select, DateRangePicker, ...). Laid out in a responsive grid. */
  children: React.ReactNode
  /** Number of filters currently applied; shows the reset button when greater than zero. */
  activeCount?: number
  onReset?: () => void
  resetLabel?: string
  /** Extra controls aligned to the end of the bar, e.g. an export or view toggle. */
  actions?: React.ReactNode
  label?: string
  className?: string
}

export const FilterBar: React.FC<FilterBarProps> = ({
  children,
  activeCount = 0,
  onReset,
  resetLabel = 'Reset filters',
  actions,
  label = 'Filters',
  className,
}) => {
  const showReset = Boolean(onReset) && activeCount > 0

  return (
    <section
      aria-label={label}
      className={cn('mb-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4', className)}
    >
      <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {children}
      </div>
      {(showReset || actions) && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {showReset && (
              <>
                <span aria-live="polite">
                  {activeCount} filter{activeCount === 1 ? '' : 's'} applied
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={onReset}>
                  {resetLabel}
                </Button>
              </>
            )}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
    </section>
  )
}
