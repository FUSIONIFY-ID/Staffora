import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import {
  PageHeader,
  SearchInput,
  FilterBar,
  StatusBadge,
  ConfirmDialog,
  DateRangePicker,
} from '../src/components/shared/index.js'

describe('PageHeader', () => {
  it('renders title as a level-1 heading with description and actions', () => {
    render(
      <PageHeader
        title="Projects"
        description="Manage project staffing"
        actions={<button type="button">Create project</button>}
      />,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Projects' })).toBeInTheDocument()
    expect(screen.getByText('Manage project staffing')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create project' })).toBeInTheDocument()
  })
})

describe('SearchInput', () => {
  it('emits typed value and clears it', () => {
    const handleChange = vi.fn()
    const { rerender } = render(<SearchInput value="" onChange={handleChange} label="Search projects" />)

    fireEvent.change(screen.getByLabelText('Search projects'), { target: { value: 'apollo' } })
    expect(handleChange).toHaveBeenLastCalledWith('apollo')
    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument()

    rerender(<SearchInput value="apollo" onChange={handleChange} label="Search projects" />)
    fireEvent.click(screen.getByRole('button', { name: 'Clear search projects' }))
    expect(handleChange).toHaveBeenLastCalledWith('')
  })
})

describe('FilterBar', () => {
  it('hides reset when no filters are active', () => {
    render(
      <FilterBar onReset={vi.fn()} activeCount={0}>
        <input aria-label="Role" />
      </FilterBar>,
    )

    expect(screen.getByRole('region', { name: 'Filters' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reset filters' })).not.toBeInTheDocument()
  })

  it('shows active filter count and resets', () => {
    const handleReset = vi.fn()
    render(
      <FilterBar onReset={handleReset} activeCount={2}>
        <input aria-label="Role" />
      </FilterBar>,
    )

    expect(screen.getByText('2 filters applied')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }))
    expect(handleReset).toHaveBeenCalledTimes(1)
  })
})

describe('StatusBadge', () => {
  it.each([
    ['ACTIVE', 'Active'],
    ['ARCHIVED', 'Archived'],
    ['CANCELLED', 'Cancelled'],
    ['FULFILLED', 'Fulfilled'],
    ['FULLY_AVAILABLE', 'Fully Available'],
    ['PARTIALLY_AVAILABLE', 'Partially Available'],
    ['FULLY_ALLOCATED', 'Fully Allocated'],
  ] as const)('renders %s as "%s"', (status, label) => {
    render(<StatusBadge status={status} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it('supports a custom label', () => {
    render(<StatusBadge status="OPEN" label="Terbuka" />)
    expect(screen.getByText('Terbuka')).toBeInTheDocument()
  })
})

describe('ConfirmDialog', () => {
  it('does not render when closed', () => {
    render(<ConfirmDialog isOpen={false} title="Cancel allocation" description="Sure?" onConfirm={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('confirms and cancels', () => {
    const handleConfirm = vi.fn()
    const handleCancel = vi.fn()
    render(
      <ConfirmDialog
        isOpen
        title="Cancel allocation"
        description="This allocation will no longer consume capacity."
        confirmLabel="Cancel allocation"
        cancelLabel="Keep"
        variant="danger"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />,
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel allocation' }))
    fireEvent.click(screen.getByRole('button', { name: 'Keep' }))
    expect(handleConfirm).toHaveBeenCalledTimes(1)
    expect(handleCancel).toHaveBeenCalledTimes(1)
  })

  it('blocks both actions while loading', () => {
    const handleConfirm = vi.fn()
    const handleCancel = vi.fn()
    render(
      <ConfirmDialog isOpen isLoading title="End allocation" description="End now?" onConfirm={handleConfirm} onCancel={handleCancel} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(handleConfirm).not.toHaveBeenCalled()
    expect(handleCancel).not.toHaveBeenCalled()
  })
})

describe('DateRangePicker', () => {
  it('emits ISO dates for start and end', () => {
    const handleChange = vi.fn()
    render(<DateRangePicker value={{ startDate: '2026-11-01', endDate: '' }} onChange={handleChange} />)

    fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2026-11-15' } })
    expect(handleChange).toHaveBeenCalledWith({ startDate: '2026-11-01', endDate: '2026-11-15' })
  })

  it('flags an end date before the start date', () => {
    render(<DateRangePicker value={{ startDate: '2026-11-15', endDate: '2026-11-01' }} onChange={vi.fn()} />)

    expect(screen.getByRole('alert')).toHaveTextContent('End date must be on or after the start date.')
    expect(screen.getByLabelText('Start date')).toHaveAttribute('aria-invalid', 'true')
  })

  it('allows a same-day inclusive range and constrains to min/max', () => {
    render(
      <DateRangePicker
        value={{ startDate: '2026-11-01', endDate: '2026-11-01' }}
        onChange={vi.fn()}
        min="2026-10-01"
        max="2026-12-31"
      />,
    )

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Start date')).toHaveAttribute('min', '2026-10-01')
    expect(screen.getByLabelText('End date')).toHaveAttribute('max', '2026-12-31')
  })
})
