import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ResourceDetailPage } from '../src/features/resources/resource-detail-page.js'
import { ResourceCapacityCard } from '../src/features/resources/components/resource-capacity-card.js'
import { ResourceSkillsCard } from '../src/features/resources/components/resource-skills-card.js'
import { ResourceAllocationsTable } from '../src/features/resources/components/resource-allocations-table.js'
import * as AuthContextModule from '../src/app/providers/auth-provider.js'
import * as UseResourcesModule from '../src/features/resources/hooks/use-resources.js'
import type { Role, UserProfile } from '../src/app/providers/auth-provider.js'
import {
  DEPARTMENT_DELIVERY,
  DEPARTMENT_ENGINEERING,
  DETAIL_PARTIAL,
  JOB_ROLE_DEVELOPER,
  JOB_ROLE_MANAGER,
} from './fixtures/resources-fixtures.js'

const mockAuthUser = (role: Role): UserProfile => ({
  id: `user-${role.toLowerCase()}`,
  email: `${role.toLowerCase()}@staffora.internal`,
  role,
  isActive: true,
})

const renderDetailPage = (role: Role = 'ADMIN', path = `/resources/${DETAIL_PARTIAL.id}`) => {
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
    user: mockAuthUser(role),
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
  })

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/resources/:employeeId" element={<ResourceDetailPage />} />
          <Route path="/resources" element={<div>Resources Directory</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ResourceDetailPage (AC04 - Resource Profile & Detail)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()

    vi.spyOn(UseResourcesModule, 'useDepartments').mockReturnValue({
      data: [DEPARTMENT_ENGINEERING, DEPARTMENT_DELIVERY],
      isPending: false,
      isError: false,
    } as ReturnType<typeof UseResourcesModule.useDepartments>)

    vi.spyOn(UseResourcesModule, 'useJobRoles').mockReturnValue({
      data: [JOB_ROLE_DEVELOPER, JOB_ROLE_MANAGER],
      isPending: false,
      isError: false,
    } as ReturnType<typeof UseResourcesModule.useJobRoles>)

    vi.spyOn(UseResourcesModule, 'useEmployeeDetail').mockReturnValue({
      data: DETAIL_PARTIAL,
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as unknown as ReturnType<typeof UseResourcesModule.useEmployeeDetail>)
  })

  it('renders employee identity header, profile card, skills, capacity and allocations', () => {
    renderDetailPage('ADMIN')

    // Header info
    expect(screen.getByRole('heading', { level: 1, name: 'Siti Rahayu' })).toBeInTheDocument()
    expect(screen.getByText(/EMP002 · Delivery Manager · Delivery/i)).toBeInTheDocument()

    // Profile card
    expect(screen.getByText('SR')).toBeInTheDocument()
    expect(screen.getByText('siti.rahayu@staffora.internal')).toBeInTheDocument()
    expect(screen.getByText('Delivery')).toBeInTheDocument()
    expect(screen.getAllByText('Active').length).toBeGreaterThanOrEqual(1)

    // Capacity card
    expect(screen.getByRole('heading', { name: /Current capacity/i })).toBeInTheDocument()
    expect(screen.getByText('55% allocated')).toBeInTheDocument()
    expect(screen.getByText('45% remaining capacity')).toBeInTheDocument()

    // Skills card
    expect(screen.getByRole('heading', { name: /Skills & proficiency/i })).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument()

    // Allocations table
    expect(screen.getByText('Staffora Platform')).toBeInTheDocument()
    expect(screen.getByText('Backend Engineer')).toBeInTheDocument()
    expect(screen.getByText('Jan 01, 2026')).toBeInTheDocument()
    expect(screen.getByText('Jun 30, 2026')).toBeInTheDocument()
  })

  it('allows ADMIN and RESOURCE_MANAGER to see the Edit resource button', () => {
    const { unmount } = renderDetailPage('ADMIN')
    expect(screen.getByRole('button', { name: /Edit resource/i })).toBeInTheDocument()
    unmount()

    renderDetailPage('RESOURCE_MANAGER')
    expect(screen.getByRole('button', { name: /Edit resource/i })).toBeInTheDocument()
  })

  it('enforces read-only mode for PROJECT_MANAGER and EMPLOYEE (no Edit button)', () => {
    const { unmount } = renderDetailPage('PROJECT_MANAGER')
    expect(screen.queryByRole('button', { name: /Edit resource/i })).not.toBeInTheDocument()
    unmount()

    renderDetailPage('EMPLOYEE')
    expect(screen.queryByRole('button', { name: /Edit resource/i })).not.toBeInTheDocument()
  })

  it('renders loading state while profile data is pending', () => {
    vi.spyOn(UseResourcesModule, 'useEmployeeDetail').mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
    } as unknown as ReturnType<typeof UseResourcesModule.useEmployeeDetail>)

    renderDetailPage('ADMIN')

    expect(screen.getByText(/Loading resource profile.../i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Back to resources/i })).toBeInTheDocument()
  })

  it('renders error state with retry button on query failure', () => {
    const refetch = vi.fn()
    vi.spyOn(UseResourcesModule, 'useEmployeeDetail').mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: new Error('Network connection failed'),
      refetch,
      isFetching: false,
    } as unknown as ReturnType<typeof UseResourcesModule.useEmployeeDetail>)

    renderDetailPage('ADMIN')

    expect(screen.getByRole('heading', { name: /Could not load this resource/i })).toBeInTheDocument()
    expect(screen.getByText(/Network connection failed/i)).toBeInTheDocument()

    const retryButton = screen.getByRole('button', { name: /Try again/i })
    expect(retryButton).toBeInTheDocument()
    fireEvent.click(retryButton)
    expect(refetch).toHaveBeenCalledTimes(1)
  })
})

describe('Resource detail subcomponents edge cases', () => {
  it('renders empty message in skills card when employee has no skills', () => {
    render(<ResourceSkillsCard skills={[]} />)
    expect(screen.getByText(/No skills have been recorded for this resource yet./i)).toBeInTheDocument()
  })

  it('renders empty message in allocations table when employee has no allocations', () => {
    render(<ResourceAllocationsTable allocations={[]} />)
    expect(
      screen.getByText(/This resource is not allocated to any project in the selected period./i),
    ).toBeInTheDocument()
  })

  it('clamps capacity evaluation within 0-100% in capacity card', () => {
    render(
      <ResourceCapacityCard
        resource={{
          ...DETAIL_PARTIAL,
          evaluatedPeriod: {
            peakConcurrentAllocation: 120,
            remainingCapacity: -20,
          },
        }}
      />,
    )

    expect(screen.getByText('100% allocated')).toBeInTheDocument()
    expect(screen.getByText('0% remaining capacity')).toBeInTheDocument()
  })
})
