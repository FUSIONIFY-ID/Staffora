import React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table.js'
import { EmptyState } from '../feedback/empty-state.js'
import { LoadingState } from '../feedback/loading-state.js'
import { cn } from '../../lib/utils.js'

export type SortDirection = 'asc' | 'desc'

export interface SortState {
  columnId: string
  direction: SortDirection
}

export interface DataTableColumn<TRow> {
  id: string
  header: React.ReactNode
  cell: (row: TRow) => React.ReactNode
  align?: 'left' | 'center' | 'right'
  /** Enables a sort toggle in the header. Sorting itself is done by the API via `onSortChange`. */
  sortable?: boolean
  className?: string
  headerClassName?: string
}

export interface DataTableProps<TRow> {
  data: readonly TRow[]
  columns: readonly DataTableColumn<TRow>[]
  getRowId: (row: TRow) => string
  /** Screen-reader caption describing the table contents. */
  caption: string
  isLoading?: boolean
  loadingMessage?: string
  emptyTitle?: string
  emptyDescription?: string
  /** Replaces the default empty state, e.g. with a call-to-action. */
  emptyState?: React.ReactNode
  onRowClick?: (row: TRow) => void
  sort?: SortState
  onSortChange?: (sort: SortState) => void
  /** Minimum table width before horizontal scrolling kicks in, keeps columns readable on narrow screens. */
  minWidth?: string
  className?: string
}

const alignClass = { left: 'text-left', center: 'text-center', right: 'text-right' } as const

function nextSort(current: SortState | undefined, columnId: string): SortState {
  if (current?.columnId === columnId && current.direction === 'asc') {
    return { columnId, direction: 'desc' }
  }
  return { columnId, direction: 'asc' }
}

function ariaSort(sort: SortState | undefined, columnId: string): React.AriaAttributes['aria-sort'] {
  if (sort?.columnId !== columnId) return 'none'
  return sort.direction === 'asc' ? 'ascending' : 'descending'
}

export function DataTable<TRow>({
  data,
  columns,
  getRowId,
  caption,
  isLoading = false,
  loadingMessage = 'Loading data...',
  emptyTitle,
  emptyDescription,
  emptyState,
  onRowClick,
  sort,
  onSortChange,
  minWidth = '720px',
  className,
}: DataTableProps<TRow>): React.ReactElement {
  if (isLoading) {
    return <LoadingState message={loadingMessage} />
  }

  if (data.length === 0) {
    return <>{emptyState ?? <EmptyState title={emptyTitle} description={emptyDescription} />}</>
  }

  const handleRowKeyDown = (event: React.KeyboardEvent<HTMLTableRowElement>, row: TRow): void => {
    if (onRowClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      onRowClick(row)
    }
  }

  return (
    <Table containerClassName={className} style={{ minWidth }}>
      <caption className="sr-only">{caption}</caption>
      <TableHeader>
        <tr>
          {columns.map((column) => {
            const align = alignClass[column.align ?? 'left']
            const canSort = Boolean(column.sortable && onSortChange)
            return (
              <TableHead
                key={column.id}
                scope="col"
                aria-sort={canSort ? ariaSort(sort, column.id) : undefined}
                className={cn(align, column.headerClassName)}
              >
                {canSort && onSortChange ? (
                  <button
                    type="button"
                    onClick={() => onSortChange(nextSort(sort, column.id))}
                    className="inline-flex cursor-pointer items-center gap-1 uppercase tracking-wider hover:text-slate-200"
                  >
                    {column.header}
                    <span aria-hidden="true" className="text-[10px]">
                      {sort?.columnId === column.id ? (sort.direction === 'asc' ? '▲' : '▼') : '↕'}
                    </span>
                  </button>
                ) : (
                  column.header
                )}
              </TableHead>
            )
          })}
        </tr>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow
            key={getRowId(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            onKeyDown={onRowClick ? (event) => handleRowKeyDown(event, row) : undefined}
            tabIndex={onRowClick ? 0 : undefined}
            className={cn(onRowClick && 'cursor-pointer focus:bg-slate-800/40 focus:outline-none')}
          >
            {columns.map((column) => (
              <TableCell key={column.id} className={cn(alignClass[column.align ?? 'left'], column.className)}>
                {column.cell(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
