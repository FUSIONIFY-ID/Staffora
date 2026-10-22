import React from 'react'
import { Button } from '../../../components/ui/button.js'
import type { EmployeeListMeta } from '../api/resources-api.js'

export interface ResourcePaginationProps {
  meta: EmployeeListMeta
  isFetching: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

const PAGE_SIZE_OPTIONS = [10, 20, 50]

/**
 * Pagination controls driven entirely by the server's `meta` block.
 *
 * `totalPages` is read from the response instead of being derived from
 * `data.length`, because a page can legitimately be short or empty while more
 * records exist (for example after a filter change lands on a later page).
 */
export const ResourcePagination: React.FC<ResourcePaginationProps> = ({
  meta,
  isFetching,
  onPageChange,
  onPageSizeChange,
}) => {
  const totalPages = Math.max(meta.totalPages, 1)
  const currentPage = Math.min(Math.max(meta.page, 1), totalPages)
  const firstRow = meta.total === 0 ? 0 : (currentPage - 1) * meta.pageSize + 1
  const lastRow = Math.min(currentPage * meta.pageSize, meta.total)

  return (
    <nav
      aria-label="Resource pagination"
      className="flex flex-col gap-3 border-t border-slate-800 pt-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-xs text-slate-400" aria-live="polite">
        {meta.total === 0
          ? 'No resources to display'
          : `Showing ${firstRow}–${lastRow} of ${meta.total} resources`}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <label
          htmlFor="resource-page-size"
          className="text-xs font-medium text-slate-400 whitespace-nowrap"
        >
          Rows per page
        </label>
        <select
          id="resource-page-size"
          value={meta.pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="rounded-lg border border-slate-700/80 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1 || isFetching}
            aria-label="Previous page"
          >
            Previous
          </Button>
          <span className="text-xs text-slate-400 whitespace-nowrap">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || isFetching}
            aria-label="Next page"
          >
            Next
          </Button>
        </div>
      </div>
    </nav>
  )
}
