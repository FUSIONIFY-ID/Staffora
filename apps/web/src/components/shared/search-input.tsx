import React, { useId } from 'react'
import { cn } from '../../lib/utils.js'

export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  /** Accessible label; rendered visually only when `showLabel` is true. */
  label?: string
  showLabel?: boolean
  placeholder?: string
  disabled?: boolean
  className?: string
}

/**
 * Controlled search field. Pair with `useDebouncedValue` before putting the value
 * into a TanStack Query key so the API is not called on every keystroke.
 */
export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  label = 'Search',
  showLabel = false,
  placeholder = 'Search...',
  disabled,
  className,
}) => {
  const inputId = useId()

  return (
    <div className={cn('w-full space-y-1.5 text-left', className)}>
      <label
        htmlFor={inputId}
        className={cn(
          'block text-xs font-semibold uppercase tracking-wider text-slate-300',
          !showLabel && 'sr-only',
        )}
      >
        {label}
      </label>
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
        </svg>
        <input
          id={inputId}
          type="search"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-lg border border-slate-700/80 bg-slate-900/80 py-2 pl-9 pr-9 text-sm text-slate-100 placeholder-slate-500 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 [&::-webkit-search-cancel-button]:hidden"
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
            aria-label={`Clear ${label.toLowerCase()}`}
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
