import React, { useId } from 'react'
import { cn } from '../../lib/utils.js'
import { getPageItems } from './pagination-items.js'

/** Mirrors the API `PaginationMeta` contract. */
export interface PaginationProps {
  page: number
  pageSize: number
  total: number
  totalPages: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSizeOptions?: readonly number[]
  disabled?: boolean
  className?: string
}

const pageButtonClass =
  'inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-lg border px-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40'

export const Pagination: React.FC<PaginationProps> = ({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  disabled = false,
  className,
}) => {
  const pageSizeId = useId()
  const firstItem = total === 0 ? 0 : (page - 1) * pageSize + 1
  const lastItem = Math.min(page * pageSize, total)
  const items = getPageItems(page, totalPages)

  return (
    <div
      className={cn(
        'mt-4 flex flex-col gap-3 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span aria-live="polite">
          Showing {firstItem}–{lastItem} of {total}
        </span>
        {onPageSizeChange && (
          <span className="flex items-center gap-2">
            <label htmlFor={pageSizeId}>Rows per page</label>
            <select
              id={pageSizeId}
              value={pageSize}
              disabled={disabled}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="cursor-pointer rounded-md border border-slate-700/80 bg-slate-900/80 px-2 py-1 text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option} className="bg-slate-900">
                  {option}
                </option>
              ))}
            </select>
          </span>
        )}
      </div>

      {totalPages > 1 && (
        <nav aria-label="Pagination">
          <ul className="flex flex-wrap items-center gap-1">
            <li>
              <button
                type="button"
                className={cn(pageButtonClass, 'border-slate-700 text-slate-300 hover:bg-slate-800')}
                onClick={() => onPageChange(page - 1)}
                disabled={disabled || page <= 1}
                aria-label="Previous page"
              >
                ‹ Prev
              </button>
            </li>
            {items.map((item) =>
              typeof item === 'number' ? (
                <li key={item}>
                  <button
                    type="button"
                    className={cn(
                      pageButtonClass,
                      item === page
                        ? 'border-blue-500/60 bg-blue-600/20 text-blue-300'
                        : 'border-slate-700 text-slate-300 hover:bg-slate-800',
                    )}
                    onClick={() => onPageChange(item)}
                    disabled={disabled}
                    aria-label={`Page ${item}`}
                    aria-current={item === page ? 'page' : undefined}
                  >
                    {item}
                  </button>
                </li>
              ) : (
                <li key={item} aria-hidden="true" className="px-1 text-slate-500">
                  …
                </li>
              ),
            )}
            <li>
              <button
                type="button"
                className={cn(pageButtonClass, 'border-slate-700 text-slate-300 hover:bg-slate-800')}
                onClick={() => onPageChange(page + 1)}
                disabled={disabled || page >= totalPages}
                aria-label="Next page"
              >
                Next ›
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  )
}
