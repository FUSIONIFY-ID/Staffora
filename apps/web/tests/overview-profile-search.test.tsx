import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { DashboardPage } from '../src/features/dashboard/dashboard-page.js'
import { MyProfilePage } from '../src/features/my-profile/my-profile-page.js'
import { ResourceFinderPage } from '../src/features/resource-finder/resource-finder-page.js'

const { apiClient } = vi.hoisted(() => ({ apiClient: vi.fn() }))
vi.mock('../src/api/client.js', () => ({ apiClient }))
vi.mock('../src/app/providers/auth-provider.js', () => ({ useAuth: () => ({ user: { role: 'ADMIN' } }) }))

function renderPage(page: React.ReactNode): void {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<QueryClientProvider client={client}><MemoryRouter>{page}</MemoryRouter></QueryClientProvider>)
}

describe('overview, profile, and resource finder', () => {
  it('renders API-backed dashboard metrics', async () => {
    apiClient.mockResolvedValueOnce({ data: { totalActiveResources: 4, totalActiveProjects: 2, fullyAvailableResources: 1, fullyAllocatedResources: 1, openStaffingRequirements: 3, capacityDistribution: { fullyAvailable: 1, partiallyAvailable: 2, fullyAllocated: 1 } } })
    renderPage(<DashboardPage />)
    expect(await screen.findByText('4')).toBeInTheDocument()
    expect(apiClient).toHaveBeenCalledWith(expect.stringContaining('/dashboard?startDate='))
  })

  it('renders the current-user profile and empty skills state', async () => {
    apiClient.mockResolvedValueOnce({ data: { profile: { id: 'emp-1', fullName: 'Budi Santoso', workEmail: 'budi@staffora.test', departmentName: 'Engineering', jobRoleTitle: 'Developer' }, skills: [], currentAllocations: [], plannedAllocations: [], currentTotalAllocation: 20, remainingCapacity: 80 } })
    renderPage(<MyProfilePage />)
    expect(await screen.findByText('Budi Santoso')).toBeInTheDocument()
    expect(screen.getByText('No skills have been recorded yet.')).toBeInTheDocument()
    expect(apiClient).toHaveBeenCalledWith('/me')
  })

  it('does not call finder API before submit and renders results after submit', async () => {
    renderPage(<ResourceFinderPage />)
    expect(apiClient).not.toHaveBeenCalled()
    apiClient.mockResolvedValueOnce({ data: [{ employeeId: 'emp-1', fullName: 'Budi Santoso', remainingCapacity: 70, skills: [] }] })
    fireEvent.click(screen.getByRole('button', { name: 'Find resources' }))
    await waitFor(() => expect(apiClient).toHaveBeenCalledWith(expect.stringContaining('/resource-finder?startDate=')))
    expect(await screen.findByText('Budi Santoso')).toBeInTheDocument()
  })
})
