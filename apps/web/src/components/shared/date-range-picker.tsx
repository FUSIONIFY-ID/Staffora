import React, { useId } from 'react'
import { cn } from '../../lib/utils.js'

/** ISO calendar dates (`YYYY-MM-DD`), matching the API `format: date` fields. */
export interface DateRange {
  startDate: string
  endDate: string
}

export interface DateRangePickerProps {
  value: DateRange
  onChange: (value: DateRange) => void
  legend?: string
  startLabel?: string
  endLabel?: string
  /** Earliest selectable date, e.g. the project start date. */
  min?: string
  /** Latest selectable date, e.g. the project end date. */
  max?: string
  /** External error (e.g. from a Zod schema); shown instead of the built-in order check. */
  error?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

const inputClass =
  'w-full rounded-lg border bg-slate-900/80 px-3.5 py-2 text-sm text-slate-100 transition-all focus:outline-none focus:ring-2 disabled:opacity-50 [color-scheme:dark]'

/**
 * Inclusive start/end date selector. ISO dates compare correctly as strings, so the
 * order check needs no date parsing. Business validation stays with the backend.
 */
export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  legend = 'Date range',
  startLabel = 'Start date',
  endLabel = 'End date',
  min,
  max,
  error,
  required,
  disabled,
  className,
}) => {
  const baseId = useId()
  const startId = `${baseId}-start`
  const endId = `${baseId}-end`
  const errorId = `${baseId}-error`

  const isOrderInvalid = Boolean(value.startDate && value.endDate && value.endDate < value.startDate)
  const message = error ?? (isOrderInvalid ? 'End date must be on or after the start date.' : undefined)
  const borderClass = message
    ? 'border-red-500/80 focus:border-red-400 focus:ring-red-500/20'
    : 'border-slate-700/80 focus:border-blue-500 focus:ring-blue-500/20'

  return (
    <fieldset className={cn('w-full min-w-0 space-y-1.5 text-left', className)} disabled={disabled}>
      <legend className="sr-only">{legend}</legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor={startId} className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            {startLabel}
          </label>
          <input
            id={startId}
            type="date"
            value={value.startDate}
            min={min}
            max={value.endDate || max}
            required={required}
            aria-invalid={Boolean(message)}
            aria-describedby={message ? errorId : undefined}
            onChange={(event) => onChange({ ...value, startDate: event.target.value })}
            className={cn(inputClass, borderClass)}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={endId} className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            {endLabel}
          </label>
          <input
            id={endId}
            type="date"
            value={value.endDate}
            min={value.startDate || min}
            max={max}
            required={required}
            aria-invalid={Boolean(message)}
            aria-describedby={message ? errorId : undefined}
            onChange={(event) => onChange({ ...value, endDate: event.target.value })}
            className={cn(inputClass, borderClass)}
          />
        </div>
      </div>
      {message && (
        <p id={errorId} role="alert" className="text-xs font-medium text-red-400">
          {message}
        </p>
      )}
    </fieldset>
  )
}
