import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ResourcePagination } from '../src/features/resources/components/resource-pagination.js'
import { ResourceTable } from '../src/features/resources/components/resource-table.js'
import { ResourcesPage } from '../src/features/resources/resources-page.js'
import * as AuthContextModule from '../src/app/providers/auth-provider.js'
import * as UseResourcesModule from '../src/features/resources/hooks/use-resources.js'
import type { Role, UserProfile } from '../src/app/providers/auth-provider.js'
import {
  ALL_EMPLOYEES,
  DEPARTMENT_DELIVERY,
  DEPARTMENT_ENGINEERING,
  EMPLOYEE_AVAILABLE,
  JOB_ROLE_DEVELOPER,
  JOB_ROLE_MANAGER,
} from './fixtures/resources-fixtures.js'

const mockAuthUser = (role: Role): UserProfile => ({
  id: `user-${role.toLowerCase()}`,
  email: `${role.toLowerCase()}@staffora.internal`,
  role,
  isActive: true,
})

describe('ResourcePagination (AC01.04 - Pagination controls)', () => {
  it('displays correct range summary and page counts', () => {
    render(
      <ResourcePagination
        meta={{ page: 1, pageSize: 20, total: 45, totalPages: 3 }}
        isFetching={false}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    )

    expect(screen.getByText('Showing 1–20 of 45 resources')).toBeInTheDocument()
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
  })

  it('renders empty label when total is 0', () => {
    render(
      <ResourcePagination
        meta={{ page: 1, pageSize: 20, total: 0, totalPages: 1 }}
        isFetching={false}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    )

    expect(screen.getByText('No resources to display')).toBeInTheDocument()
  })

  it('disables Previous on page 1 and Next on last page', () => {
    const { rerender } = render(
      <ResourcePagination
        meta={{ page: 1, pageSize: 20, total: 40, totalPages: 2 }}
        isFetching={false}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    )

    const prevButton = screen.getByRole('button', { name: /Previous page/i })
    const nextButton = screen.getByRole('button', { name: /Next page/i })

    expect(prevButton).toBeDisabled()
    expect(nextButton).toBeEnabled()

    rerender(
      <ResourcePagination
        meta={{ page: 2, pageSize: 20, total: 40, totalPages: 2 }}
        isFetching={false}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    )

    expect(prevButton).toBeEnabled()
    expect(nextButton).toBeDisabled()
  })

  it('triggers onPageChange when clicking Previous or Next', () => {
    const onPageChange = vi.fn()

    render(
      <ResourcePagination
        meta={{ page: 2, pageSize: 20, total: 60, totalPages: 3 }}
        isFetching={false}
        onPageChange={onPageChange}
        onPageSizeChange={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Previous page/i }))
    expect(onPageChange).toHaveBeenCalledWith(1)

    fireEvent.click(screen.getByRole('button', { name: /Next page/i }))
    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('triggers onPageSizeChange when selecting different page size', () => {
    const onPageSizeChange = vi.fn()

    render(
      <ResourcePagination
        meta={{ page: 1, pageSize: 20, total: 60, totalPages: 3 }}
        isFetching={false}
        onPageChange={vi.fn()}
        onPageSizeChange={onPageSizeChange}
      />,
    )

    fireEvent.change(screen.getByLabelText(/Rows per page/i), { target: { value: '50' } })
    expect(onPageSizeChange).toHaveBeenCalledWith(50)
  })
})

describe('ResourceTable row click interaction', () => {
  it('navigates to detail page when clicking a table row', () => {
    render(
      <MemoryRouter initialEntries={['/resources']}>
        <Routes>
          <Route
            path="/resources"
            element={<ResourceTable employees={ALL_EMPLOYEES} canManage={false} onEdit={vi.fn()} />}
          />
          <Route path="/resources/:employeeId" element={<div>Detail Loaded</div>} />
        </Routes>
      </MemoryRouter>,
    )

    const rows = screen.getAllByRole('row')
    const firstDataRow = rows[1]
    if (!firstDataRow) throw new Error('Expected at least one data row')

    fireEvent.click(firstDataRow)
    expect(screen.getByText('Detail Loaded')).toBeInTheDocument()
  })

  it('stops navigation propagation when clicking Edit button', () => {
    const onEdit = vi.fn()

    render(
      <MemoryRouter initialEntries={['/resources']}>
        <Routes>
          <Route
            path="/resources"
            element={<ResourceTable employees={ALL_EMPLOYEES} canManage={true} onEdit={onEdit} />}
          />
          <Route path="/resources/:employeeId" element={<div>Detail Loaded</div>} />
        </Routes>
      </MemoryRouter>,
    )

    const editButton = screen.getByRole('button', { name: `Edit ${EMPLOYEE_AVAILABLE.fullName}` })
    fireEvent.click(editButton)

    expect(onEdit).toHaveBeenCalledWith(EMPLOYEE_AVAILABLE)
    expect(screen.queryByText('Detail Loaded')).not.toBeInTheDocument()
  })
})

describe('ResourcesPage role-based permissions (RBAC)', () => {
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

    vi.spyOn(UseResourcesModule, 'useEmployeeList').mockReturnValue({
      data: {
        data: ALL_EMPLOYEES,
        meta: { page: 1, pageSize: 20, total: 3, totalPages: 1 },
      },
      isPending: false,
      isError: false,
      isFetching: false,
    } as unknown as ReturnType<typeof UseResourcesModule.useEmployeeList>)
  })

  it('renders read-only notice and hides Add Resource for PROJECT_MANAGER', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockAuthUser('PROJECT_MANAGER'),
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
    })

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ResourcesPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(
      screen.getByText(/Resource records are read-only for this role/i),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /\+ Add Resource/i })).not.toBeInTheDocument()
  })

  it('renders + Add Resource button for ADMIN without read-only notice', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockAuthUser('ADMIN'),
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
    })

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ResourcesPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(
      screen.queryByText(/Resource records are read-only for this role./i),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /\+ Add Resource/i })).toBeInTheDocument()
  })
})
