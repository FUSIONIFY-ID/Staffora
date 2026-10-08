import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DataTable, type DataTableColumn } from '../src/components/shared/index.js'

interface Row {
  id: string
  name: string
  allocation: number
}

const rows: Row[] = [
  { id: 'a', name: 'Ayu', allocation: 80 },
  { id: 'b', name: 'Budi', allocation: 20 },
]

const columns: DataTableColumn<Row>[] = [
  { id: 'name', header: 'Name', cell: (row) => row.name, sortable: true },
  { id: 'allocation', header: 'Allocation', cell: (row) => `${row.allocation}%`, align: 'right' },
]

describe('DataTable', () => {
  it('renders rows and a screen-reader caption', () => {
    render(<DataTable data={rows} columns={columns} getRowId={(row) => row.id} caption="Employees" />)

    const table = screen.getByRole('table', { name: 'Employees' })
    expect(within(table).getAllByRole('row')).toHaveLength(3)
    expect(screen.getByText('80%')).toBeInTheDocument()
  })

  it('shows the loading state instead of rows', () => {
    render(<DataTable data={rows} columns={columns} getRowId={(row) => row.id} caption="Employees" isLoading />)

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('shows the empty state when there is no data', () => {
    render(
      <DataTable
        data={[]}
        columns={columns}
        getRowId={(row) => row.id}
        caption="Employees"
        emptyTitle="No employees"
        emptyDescription="Try another filter"
      />,
    )

    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    expect(screen.getByText('No employees')).toBeInTheDocument()
  })

  it('cycles sort direction and exposes aria-sort', () => {
    const handleSort = vi.fn()
    const { rerender } = render(
      <DataTable data={rows} columns={columns} getRowId={(row) => row.id} caption="Employees" onSortChange={handleSort} />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Name/ }))
    expect(handleSort).toHaveBeenLastCalledWith({ columnId: 'name', direction: 'asc' })

    rerender(
      <DataTable
        data={rows}
        columns={columns}
        getRowId={(row) => row.id}
        caption="Employees"
        sort={{ columnId: 'name', direction: 'asc' }}
        onSortChange={handleSort}
      />,
    )
    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute('aria-sort', 'ascending')
    fireEvent.click(screen.getByRole('button', { name: /Name/ }))
    expect(handleSort).toHaveBeenLastCalledWith({ columnId: 'name', direction: 'desc' })
  })

  it('supports row activation by click and keyboard', () => {
    const handleRowClick = vi.fn()
    render(
      <DataTable data={rows} columns={columns} getRowId={(row) => row.id} caption="Employees" onRowClick={handleRowClick} />,
    )

    const budiRow = screen.getByText('Budi').closest('tr')
    if (!budiRow) throw new Error('row not found')
    fireEvent.click(budiRow)
    fireEvent.keyDown(budiRow, { key: 'Enter' })
    expect(handleRowClick).toHaveBeenCalledTimes(2)
    expect(handleRowClick).toHaveBeenCalledWith(rows[1])
  })
})
