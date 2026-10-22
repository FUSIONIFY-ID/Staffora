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
      className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-xs text-ink-muted" aria-live="polite">
        {meta.total === 0
          ? 'No resources to display'
          : `Showing ${firstRow}–${lastRow} of ${meta.total} resources`}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <label
          htmlFor="resource-page-size"
          className="text-xs font-medium text-ink-muted whitespace-nowrap"
        >
          Rows per page
        </label>
        <select
          id="resource-page-size"
          value={meta.pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="rounded-lg border border-line-input bg-surface-white px-2.5 py-1.5 text-xs text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
          <span className="text-xs text-ink-muted whitespace-nowrap">
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
