import { render, renderHook, act, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Pagination, getPageItems, useDebouncedValue } from '../src/components/shared/index.js'

describe('getPageItems', () => {
  it('returns every page when they fit', () => {
    expect(getPageItems(1, 5)).toEqual([1, 2, 3, 4, 5])
    expect(getPageItems(1, 0)).toEqual([])
  })

  it('collapses pages near the start, middle and end', () => {
    expect(getPageItems(2, 20)).toEqual([1, 2, 3, 4, 5, 'ellipsis-end', 20])
    expect(getPageItems(10, 20)).toEqual([1, 'ellipsis-start', 9, 10, 11, 'ellipsis-end', 20])
    expect(getPageItems(19, 20)).toEqual([1, 'ellipsis-start', 16, 17, 18, 19, 20])
  })
})

describe('Pagination', () => {
  it('summarizes the visible range from PaginationMeta', () => {
    render(<Pagination page={2} pageSize={20} total={45} totalPages={3} onPageChange={vi.fn()} />)
    expect(screen.getByText('Showing 21–40 of 45')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page')
  })

  it('navigates and disables bounds', () => {
    const handlePage = vi.fn()
    render(<Pagination page={1} pageSize={20} total={45} totalPages={3} onPageChange={handlePage} />)

    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
    fireEvent.click(screen.getByRole('button', { name: 'Page 3' }))
    expect(handlePage).toHaveBeenNthCalledWith(1, 2)
    expect(handlePage).toHaveBeenNthCalledWith(2, 3)
  })

  it('hides page navigation for a single page and changes page size', () => {
    const handleSize = vi.fn()
    render(
      <Pagination page={1} pageSize={20} total={0} totalPages={0} onPageChange={vi.fn()} onPageSizeChange={handleSize} />,
    )

    expect(screen.getByText('Showing 0–0 of 0')).toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Rows per page'), { target: { value: '50' } })
    expect(handleSize).toHaveBeenCalledWith(50)
  })
})

describe('useDebouncedValue', () => {
  it('delays updates until the value settles', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'ab' })
    expect(result.current).toBe('a')
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe('ab')
    vi.useRealTimers()
  })
})
