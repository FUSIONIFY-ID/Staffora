import React, { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../api/client.js'
import { useAuth } from '../../app/providers/auth-provider.js'
import { Alert } from '../../components/ui/alert.js'
import { ResourceFilters } from './components/resource-filters.js'
import { ResourceTable } from './components/resource-table.js'
import { ResourceErrorAlert } from './components/resource-error-alert.js'
import { ResourceFormModal, type ResourceFormData } from './components/resource-form-modal.js'
import type {
  ResourceItem,
  DepartmentItem,
  JobRoleItem,
  ResourceFiltersState,
  PaginationMetadata,
} from './components/types.js'

export const ResourcesPage: React.FC = (): React.JSX.Element => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const canManage = user?.role === 'ADMIN' || user?.role === 'RESOURCE_MANAGER'
  const [searchParams, setSearchParams] = useSearchParams()

  const filters: ResourceFiltersState = useMemo(
    () => ({
      search: searchParams.get('search') ?? '',
      departmentId: searchParams.get('departmentId') ?? '',
      jobRoleId: searchParams.get('jobRoleId') ?? '',
      status: (searchParams.get('status') as ResourceFiltersState['status']) || 'ALL',
      page: Number(searchParams.get('page') ?? '1') || 1,
      pageSize: Number(searchParams.get('pageSize') ?? '20') || 20,
    }),
    [searchParams],
  )

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<ResourceItem | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const updateFilters = (updates: Partial<ResourceFiltersState>): void => {
    const isFilterChange =
      'search' in updates || 'departmentId' in updates || 'jobRoleId' in updates || 'status' in updates
    const nextPage = isFilterChange && !('page' in updates) ? 1 : (updates.page ?? filters.page)
    const next = { ...filters, ...updates, page: nextPage }

    const newParams = new URLSearchParams()
    if (next.search) newParams.set('search', next.search)
    if (next.departmentId) newParams.set('departmentId', next.departmentId)
    if (next.jobRoleId) newParams.set('jobRoleId', next.jobRoleId)
    if (next.status !== 'ALL') newParams.set('status', next.status)
    if (next.page > 1) newParams.set('page', String(next.page))
    setSearchParams(newParams, { replace: true })
  }

  // 1. Fetch Departments
  const departmentsQuery = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await apiClient<{ data: DepartmentItem[] }>('/departments')
      return res.data ?? []
    },
  })

  // 2. Fetch Job Roles
  const jobRolesQuery = useQuery({
    queryKey: ['job-roles'],
    queryFn: async () => {
      const res = await apiClient<{ data: JobRoleItem[] }>('/job-roles')
      return res.data ?? []
    },
  })

  // 3. Fetch Employees Directory
  const employeesQuery = useQuery({
    queryKey: ['employees', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.search) params.set('search', filters.search)
      if (filters.departmentId) params.set('departmentId', filters.departmentId)
      if (filters.jobRoleId) params.set('jobRoleId', filters.jobRoleId)
      if (filters.status !== 'ALL') params.set('status', filters.status)
      params.set('page', String(filters.page))
      params.set('pageSize', String(filters.pageSize))

      const res = await apiClient<{ data: ResourceItem[]; meta?: PaginationMetadata }>(
        `/employees?${params.toString()}`,
      )
      return {
        data: res.data ?? [],
        meta: res.meta ?? {
          page: filters.page,
          pageSize: filters.pageSize,
          total: res.data?.length ?? 0,
        },
      }
    },
  })

  // 4. Create Employee Mutation
  const createMutation = useMutation({
    mutationFn: async (input: ResourceFormData) => {
      return apiClient('/employees', {
        method: 'POST',
        body: JSON.stringify(input),
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['employees'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      void queryClient.invalidateQueries({ queryKey: ['capacity'] })
      setFeedback({ type: 'success', message: 'Karyawan berhasil ditambahkan ke direktori.' })
    },
  })

  // 5. Update Employee Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ResourceFormData }) => {
      return apiClient(`/employees/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          fullName: input.fullName,
          departmentId: input.departmentId,
          jobRoleId: input.jobRoleId,
          status: input.status,
        }),
      })
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['employees'] })
      void queryClient.invalidateQueries({ queryKey: ['employee', variables.id] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      void queryClient.invalidateQueries({ queryKey: ['capacity'] })
      setFeedback({ type: 'success', message: 'Profil karyawan berhasil diperbarui.' })
    },
  })

  const handleOpenCreate = (): void => {
    setEditingResource(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (res: ResourceItem): void => {
    setEditingResource(res)
    setIsModalOpen(true)
  }

  const handleFormSubmit = async (data: ResourceFormData): Promise<void> => {
    if (editingResource) {
      await updateMutation.mutateAsync({ id: editingResource.id, input: data })
    } else {
      await createMutation.mutateAsync(data)
    }
  }

  const handleResetFilters = (): void => {
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  const resources = employeesQuery.data?.data ?? []
  const pagination = employeesQuery.data?.meta ?? {
    page: filters.page,
    pageSize: filters.pageSize,
    total: 0,
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Subtitle matching Figma */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Resources
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Search, filter, and manage employee resource profiles.
        </p>
      </div>

      {feedback && (
        <Alert
          type={feedback.type}
          title={feedback.type === 'success' ? 'Berhasil' : 'Kesalahan'}
        >
          {feedback.message}
        </Alert>
      )}

      {/* Filter Row matching Figma */}
      <ResourceFilters
        filters={filters}
        departments={departmentsQuery.data ?? []}
        jobRoles={jobRolesQuery.data ?? []}
        isDepartmentsLoading={departmentsQuery.isLoading}
        departmentsError={departmentsQuery.error}
        onRetryDepartments={() => void departmentsQuery.refetch()}
        isJobRolesLoading={jobRolesQuery.isLoading}
        jobRolesError={jobRolesQuery.error}
        onRetryJobRoles={() => void jobRolesQuery.refetch()}
        onFilterChange={updateFilters}
        onReset={handleResetFilters}
        canManage={canManage}
        onAddResource={handleOpenCreate}
      />

      {/* Error Handling */}
      {employeesQuery.isError && (
        <ResourceErrorAlert
          error={employeesQuery.error}
          onRetry={() => void employeesQuery.refetch()}
        />
      )}

      {/* Resources Table matching Figma */}
      <ResourceTable
        resources={resources}
        isLoading={employeesQuery.isLoading}
        pagination={pagination}
        canEdit={canManage}
        onPageChange={(page) => updateFilters({ page })}
        onEdit={handleOpenEdit}
      />

      {/* Form Modal Create / Edit */}
      {isModalOpen && (
        <ResourceFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          resourceToEdit={editingResource}
          departments={departmentsQuery.data ?? []}
          jobRoles={jobRolesQuery.data ?? []}
          isDepartmentsLoading={departmentsQuery.isLoading}
          departmentsError={departmentsQuery.error}
          onRetryDepartments={() => void departmentsQuery.refetch()}
          isJobRolesLoading={jobRolesQuery.isLoading}
          jobRolesError={jobRolesQuery.error}
          onRetryJobRoles={() => void jobRolesQuery.refetch()}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  )
}
