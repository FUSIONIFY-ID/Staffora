import React, { useState } from 'react'
import { useSearchParams } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../api/client.js'
import { useAuth } from '../../app/providers/auth-provider.js'
import { Button } from '../../components/ui/button.js'
import { Alert } from '../../components/ui/alert.js'
import { Badge } from '../../components/ui/badge.js'
import { ResourceFilters } from './components/resource-filters.js'
import { ResourceTable } from './components/resource-table.js'
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

  const [filters, setFilters] = useState<ResourceFiltersState>(() => ({
    search: searchParams.get('search') ?? '',
    departmentId: searchParams.get('departmentId') ?? '',
    jobRoleId: searchParams.get('jobRoleId') ?? '',
    status: (searchParams.get('status') as ResourceFiltersState['status']) || 'ALL',
    page: Number(searchParams.get('page') ?? '1') || 1,
    pageSize: Number(searchParams.get('pageSize') ?? '20') || 20,
  }))

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<ResourceItem | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const updateFilters = (updates: Partial<ResourceFiltersState>): void => {
    const next = { ...filters, ...updates }
    const newParams = new URLSearchParams()
    if (next.search) newParams.set('search', next.search)
    if (next.departmentId) newParams.set('departmentId', next.departmentId)
    if (next.jobRoleId) newParams.set('jobRoleId', next.jobRoleId)
    if (next.status !== 'ALL') newParams.set('status', next.status)
    if (next.page > 1) newParams.set('page', String(next.page))
    setSearchParams(newParams, { replace: true })
    setFilters(next)
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['employees'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
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
    setFilters({
      search: '',
      departmentId: '',
      jobRoleId: '',
      status: 'ALL',
      page: 1,
      pageSize: 20,
    })
  }

  const resources = employeesQuery.data?.data ?? []
  const pagination = employeesQuery.data?.meta ?? {
    page: filters.page,
    pageSize: filters.pageSize,
    total: 0,
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Direktori Karyawan & Sumber Daya</h1>
            <Badge variant="blue">Workforce</Badge>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Kelola visibilitas karyawan, peran kerja, departemen, dan ketersediaan kapasitas kerja.
          </p>
        </div>

        {canManage && (
          <Button
            id="resource-create-button"
            variant="primary"
            onClick={handleOpenCreate}
          >
            + Tambah Karyawan
          </Button>
        )}
      </div>

      {feedback && (
        <Alert
          type={feedback.type}
          title={feedback.type === 'success' ? 'Berhasil' : 'Kesalahan'}
        >
          {feedback.message}
        </Alert>
      )}

      {/* Filter Component */}
      <ResourceFilters
        filters={filters}
        departments={departmentsQuery.data ?? []}
        jobRoles={jobRolesQuery.data ?? []}
        onFilterChange={updateFilters}
        onReset={handleResetFilters}
      />

      {/* Error state with retry */}
      {employeesQuery.isError && (
        <Alert type="error" title="Gagal Memuat Data">
          Terjadi kesalahan saat memuat direktori karyawan.{' '}
          <Button
            size="sm"
            variant="outline"
            className="ml-2"
            onClick={() => void employeesQuery.refetch()}
          >
            Coba Lagi
          </Button>
        </Alert>
      )}

      {/* Data Table */}
      <ResourceTable
        resources={resources}
        isLoading={employeesQuery.isLoading}
        pagination={pagination}
        canEdit={canManage}
        onPageChange={(page) => updateFilters({ page })}
        onEdit={handleOpenEdit}
      />

      {/* Modal Form Create / Edit */}
      {isModalOpen && (
        <ResourceFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          resourceToEdit={editingResource}
          departments={departmentsQuery.data ?? []}
          jobRoles={jobRolesQuery.data ?? []}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  )
}
