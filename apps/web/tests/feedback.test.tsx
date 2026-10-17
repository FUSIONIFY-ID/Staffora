import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import {
  LoadingState,
  EmptyState,
  ErrorState,
  ForbiddenState,
  NotFoundState,
} from '../src/components/feedback/index.js'

describe('Global Feedback States', () => {
  it('renders LoadingState with message', () => {
    render(<LoadingState message="Processing request..." />)
    expect(screen.getByText('Processing request...')).toBeInTheDocument()
  })

  it('renders EmptyState with action button', () => {
    const handleAction = vi.fn()
    render(
      <EmptyState
        title="No resources yet"
        description="Add a new resource to begin"
        actionLabel="Create Resource"
        onAction={handleAction}
      />,
    )

    expect(screen.getByText('No resources yet')).toBeInTheDocument()
    expect(screen.getByText('Add a new resource to begin')).toBeInTheDocument()
    const btn = screen.getByRole('button', { name: 'Create Resource' })
    fireEvent.click(btn)
    expect(handleAction).toHaveBeenCalledTimes(1)
  })

  it('renders ErrorState with code and requestId metadata', () => {
    const handleRetry = vi.fn()
    render(
      <ErrorState
        title="Allocation Failed"
        message="Cannot exceed 100% capacity"
        code="CAPACITY_CONFLICT"
        requestId="req-xyz"
        onRetry={handleRetry}
      />,
    )

    expect(screen.getByText('Allocation Failed')).toBeInTheDocument()
    expect(screen.getByText('Cannot exceed 100% capacity')).toBeInTheDocument()
    expect(screen.getByText(/CAPACITY_CONFLICT/)).toBeInTheDocument()
    expect(screen.getByText(/req-xyz/)).toBeInTheDocument()

    const retryBtn = screen.getByRole('button', { name: 'Retry Request' })
    fireEvent.click(retryBtn)
    expect(handleRetry).toHaveBeenCalledTimes(1)
  })

  it('renders ForbiddenState with 403 messaging', () => {
    render(
      <MemoryRouter>
        <ForbiddenState userRole="EMPLOYEE" />
      </MemoryRouter>,
    )

    expect(screen.getByText(/403 - Forbidden Access/)).toBeInTheDocument()
    expect(screen.getByText(/\(EMPLOYEE\)/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Return to accessible home/i })).toBeInTheDocument()
  })

  it('renders NotFoundState with 404 message', () => {
    render(
      <MemoryRouter>
        <NotFoundState />
      </MemoryRouter>,
    )

    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText('404 - Page Not Found')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Return Home/i })).toBeInTheDocument()
  })
})
