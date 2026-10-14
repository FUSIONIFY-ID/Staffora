import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import React from 'react'
import App from '../src/App.js'
import { AppLayout } from '../src/app/layouts/app-layout.js'
import { AppHeader } from '../src/app/layouts/app-header.js'
import * as AuthContextModule from '../src/app/providers/auth-provider.js'
import type { Role, UserProfile } from '../src/app/providers/auth-provider.js'

const makeUser = (role: Role): UserProfile => ({
  id: `user-${role.toLowerCase()}`,
  email: `${role.toLowerCase()}@staffora.internal`,
  role,
  isActive: true,
  employee: {
    id: 'emp-1',
    employeeCode: 'EMP-001',
    fullName: 'Budi Santoso',
    workEmail: 'budi@staffora.internal',
    departmentId: 'dept-1',
    departmentName: 'Engineering',
    jobRoleId: 'role-1',
    jobRoleTitle: 'Full-Stack Developer',
  },
})

const mockAuth = (role: Role, logout = vi.fn()) => {
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
    user: makeUser(role),
    isLoading: false,
    login: vi.fn(),
    logout,
    refresh: vi.fn(),
  })
  return logout
}

const renderLayout = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppLayout />
    </MemoryRouter>,
  )

describe('AppLayout shell structure', () => {
  it('renders a sidebar with the grouped navigation, a header, and a content area', () => {
    mockAuth('ADMIN')
    renderLayout('/dashboard')

    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()

    // Card-specified grouping. Overview is a top-level item, not a group, per
    // design frame 02.
    expect(screen.getByRole('link', { name: 'Overview' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Workforce' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Projects' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Administration' })).toBeInTheDocument()

    // Group membership: Workforce holds Resources, Skills, Capacity
    const workforce = screen.getByRole('group', { name: 'Workforce' })
    expect(workforce).toContainElement(screen.getByRole('link', { name: 'Resources' }))
    expect(workforce).toContainElement(screen.getByRole('link', { name: 'Skills' }))
    expect(workforce).toContainElement(screen.getByRole('link', { name: 'Capacity' }))

    const projects = screen.getByRole('group', { name: 'Projects' })
    expect(projects).toContainElement(screen.getByRole('link', { name: 'Projects' }))
    expect(projects).toContainElement(screen.getByRole('link', { name: 'Allocations' }))

    const admin = screen.getByRole('group', { name: 'Administration' })
    expect(admin).toContainElement(screen.getByRole('link', { name: 'Users' }))
  })

  it('hides empty navigation groups for the employee role', () => {
    mockAuth('EMPLOYEE')
    renderLayout('/projects')

    expect(screen.getByRole('group', { name: 'Projects' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'My Workspace' })).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Workforce' })).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Administration' })).not.toBeInTheDocument()
  })

  it('keeps the role badge and signs out from the user menu', async () => {
    const logout = mockAuth('PROJECT_MANAGER')
    renderLayout('/dashboard')

    expect(screen.getAllByText('PROJECT MANAGER').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: /Budi Santoso/ }))
    const signOut = screen.getByRole('menuitem', { name: 'Sign out' })
    fireEvent.click(signOut)

    expect(logout).toHaveBeenCalledTimes(1)
  })
})

describe('AppHeader breadcrumb', () => {
  it('reflects the current route for a grouped page', () => {
    render(
      <MemoryRouter initialEntries={['/capacity']}>
        <AppHeader />
      </MemoryRouter>,
    )

    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(breadcrumb).toHaveTextContent('Workforce')
    expect(breadcrumb).toHaveTextContent('Capacity')
    expect(screen.getByText('Capacity')).toHaveAttribute('aria-current', 'page')
  })

  it('includes dynamic route segments for detail pages', () => {
    render(
      <MemoryRouter initialEntries={['/resources/emp-42']}>
        <AppHeader />
      </MemoryRouter>,
    )

    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(breadcrumb).toHaveTextContent('Resources')
    expect(breadcrumb).toHaveTextContent('emp-42')
  })

  it('renders no breadcrumb entries for an unmapped route', () => {
    render(
      <MemoryRouter initialEntries={['/not-a-route']}>
        <AppHeader />
      </MemoryRouter>,
    )

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })
})

describe('Shell fallbacks', () => {
  it('shows the not-found view for an unmatched path inside the shell', () => {
    mockAuth('ADMIN')
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/no-such-page']}>
          <App />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go to Home' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go Back' })).toBeInTheDocument()
    // The shell chrome still wraps the fallback.
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
  })

  it('keeps the shell chrome when a routed page throws', () => {
    mockAuth('ADMIN')
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const Boom: React.FC = () => {
      throw new Error('Kapasitas gagal dimuat')
    }

    render(
      <MemoryRouter initialEntries={['/boom']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/boom" element={<Boom />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Kapasitas gagal dimuat')
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    // The crash is contained: sidebar and header survive.
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument()

    consoleError.mockRestore()
  })
})
