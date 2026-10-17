import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { PageHeader } from '../src/components/page-header.js'
import { EmptyState } from '../src/components/empty-state.js'
import { ErrorState } from '../src/components/error-state.js'
import { LoadingState } from '../src/components/loading-state.js'
import { PermissionDenied } from '../src/components/permission-denied.js'

describe('PageHeader', () => {
  it('renders the title as a level-1 heading with description and actions', () => {
    render(
      <PageHeader
        title="Workforce Dashboard"
        description="Capacity overview"
        actions={<button type="button">Refresh</button>}
      />,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Workforce Dashboard' })).toBeInTheDocument()
    expect(screen.getByText('Capacity overview')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument()
  })
})

describe('EmptyState', () => {
  it('renders title, description, and a call to action', () => {
    render(
      <EmptyState
        title="No resources yet"
        description="Add a resource to get started."
        action={<button type="button">Add resource</button>}
      />,
    )

    expect(screen.getByText('No resources yet')).toBeInTheDocument()
    expect(screen.getByText('Add a resource to get started.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add resource' })).toBeInTheDocument()
  })
})

describe('ErrorState', () => {
  it('renders the message and invokes retry', () => {
    const onRetry = vi.fn()
    render(<ErrorState title="Failed to load" message="The request timed out." onRetry={onRetry} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load')
    expect(screen.getByRole('alert')).toHaveTextContent('The request timed out.')

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('omits the retry control when no handler is provided', () => {
    render(<ErrorState message="Something failed." />)

    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument()
  })
})

describe('LoadingState', () => {
  it('announces a busy status with an optional message', () => {
    render(<LoadingState message="Loading Staffora..." />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading Staffora...')
  })
})

describe('PermissionDenied', () => {
  it('shows the denied role, the required roles, and a link back to the role home', () => {
    render(
      <MemoryRouter>
        <PermissionDenied
          role="EMPLOYEE"
          homePath="/my-profile"
          requiredRoles={['ADMIN', 'RESOURCE_MANAGER']}
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Access denied' })).toBeInTheDocument()
    expect(screen.getByText('Employee')).toBeInTheDocument()
    expect(screen.getByText('Required: Admin / Resource Manager')).toBeInTheDocument()
    // The label follows the destination: an Employee's home route is My Profile.
    expect(screen.getByRole('button', { name: 'Back to My Profile' })).toBeInTheDocument()
  })

  it('omits the required-role line when the caller does not know the allowed roles', () => {
    render(
      <MemoryRouter>
        <PermissionDenied role="PROJECT_MANAGER" homePath="/dashboard" />
      </MemoryRouter>,
    )

    expect(screen.getByText('Project Manager')).toBeInTheDocument()
    expect(screen.queryByText(/^Required:/)).not.toBeInTheDocument()
  })
})
