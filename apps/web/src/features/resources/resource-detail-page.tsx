import React, { useState } from 'react'
import { useParams, Link } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, ApiError } from '../../api/client.js'
import { useAuth } from '../../app/providers/auth-provider.js'
import { Card } from '../../components/ui/card.js'
import { Badge } from '../../components/ui/badge.js'
import { Button } from '../../components/ui/button.js'
import { Spinner } from '../../components/ui/spinner.js'
import { Alert } from '../../components/ui/alert.js'
import { ResourceSkillsCard } from './components/resource-skills-card.js'
import { ResourceAllocationsTable } from './components/resource-allocations-table.js'
import { ResourceCapacityCard } from './components/resource-capacity-card.js'
import { ResourceFormModal, type ResourceFormData } from './components/resource-form-modal.js'
import type {
  ResourceDetailItem,
  DepartmentItem,
  JobRoleItem,
  EvaluatedCapacity,
} from './components/types.js'

export const ResourceDetailPage: React.FC = (): React.JSX.Element => {
  const { employeeId } = useParams<{ employeeId: string }>()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const canManage = user?.role === 'ADMIN' || user?.role === 'RESOURCE_MANAGER'

  const [dateRange, setDateRange] = useState<{ startDate?: string; endDate?: string }>({})
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // 1. Fetch Employee Detail
  const detailQuery = useQuery({
    queryKey: ['employee', employeeId, dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      if (!employeeId) throw new Error('ID Karyawan tidak valid.')
      const params = new URLSearchParams()
      if (dateRange.startDate) params.set('startDate', dateRange.startDate)
      if (dateRange.endDate) params.set('endDate', dateRange.endDate)

      const queryStr = params.toString() ? `?${params.toString()}` : ''
      const res = await apiClient<{ data: ResourceDetailItem }>(`/employees/${employeeId}${queryStr}`)
      return res.data
    },
    enabled: Boolean(employeeId),
  })

  // 2. Auxiliary Queries for Edit Modal
  const departmentsQuery = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await apiClient<{ data: DepartmentItem[] }>('/departments')
      return res.data ?? []
    },
    enabled: canManage,
  })

  const jobRolesQuery = useQuery({
    queryKey: ['job-roles'],
    queryFn: async () => {
      const res = await apiClient<{ data: JobRoleItem[] }>('/job-roles')
      return res.data ?? []
    },
    enabled: canManage,
  })

  // 3. Update Mutation
  const updateMutation = useMutation({
    mutationFn: async (input: ResourceFormData) => {
      if (!employeeId) return
      return apiClient(`/employees/${employeeId}`, {
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
      void queryClient.invalidateQueries({ queryKey: ['employee', employeeId] })
      void queryClient.invalidateQueries({ queryKey: ['employees'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setFeedback({ type: 'success', message: 'Profil karyawan berhasil diperbarui.' })
    },
  })

  const handleEditSubmit = async (data: ResourceFormData): Promise<void> => {
    await updateMutation.mutateAsync(data)
  }

  // Handle Loading
  if (detailQuery.isLoading) {
    return (
      <div className="flex min-h-96 flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-slate-400">Memuat profil karyawan...</p>
      </div>
    )
  }

  // Handle Error States
  if (detailQuery.isError) {
    const error = detailQuery.error
    const is404 = error instanceof ApiError && error.status === 404
    const is403 = error instanceof ApiError && error.status === 403

    return (
      <div className="space-y-6">
        <Link to="/resources" className="text-xs text-blue-400 hover:underline">
          &larr; Kembali ke Direktori
        </Link>
        <Alert
          type="error"
          title={is404 ? 'Karyawan Tidak Ditemukan' : is403 ? 'Akses Ditolak' : 'Gagal Memuat Profil'}
        >
          {is404
            ? 'Profil karyawan yang diminta tidak ditemukan dalam basis data sistem.'
            : is403
            ? 'Anda tidak memiliki wewenang untuk melihat profil sumber daya ini.'
            : error?.message || 'Terjadi kesalahan jaringan atau server saat memuat profil karyawan.'}
          {!is404 && !is403 && (
            <Button
              size="sm"
              variant="outline"
              className="ml-2 mt-2 block"
              onClick={() => void detailQuery.refetch()}
            >
              Coba Lagi
            </Button>
          )}
        </Alert>
      </div>
    )
  }

  const employee = detailQuery.data
  if (!employee) {
    return (
      <Alert type="warning" title="Data Tidak Ditemukan">
        Data karyawan tidak tersedia. <Link to="/resources" className="underline">Kembali</Link>
      </Alert>
    )
  }

  const initials = employee.fullName
    ? employee.fullName
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'EM'

  const evaluated: EvaluatedCapacity | undefined = employee.evaluatedPeriod ?? {
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    peakConcurrentAllocation: employee.currentAllocation ?? 0,
    remainingCapacity: employee.currentRemainingCapacity ?? 100,
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <Link to="/resources" className="text-xs font-semibold text-blue-400 hover:underline">
          &larr; Kembali ke Direktori Karyawan
        </Link>
      </div>

      {feedback && (
        <Alert
          type={feedback.type}
          title={feedback.type === 'success' ? 'Berhasil' : 'Kesalahan'}
        >
          {feedback.message}
        </Alert>
      )}

      {/* Profile Header Card */}
      <Card className="border-slate-800 bg-slate-900/60 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/15 border border-blue-500/30 text-xl font-bold text-blue-400 shadow-lg shadow-blue-500/10">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">{employee.fullName}</h1>
                <Badge variant={employee.status === 'ACTIVE' ? 'green' : 'gray'}>
                  {employee.status === 'ACTIVE' ? 'Aktif' : 'Non-Aktif'}
                </Badge>
              </div>
              <p className="font-mono text-xs text-slate-400 mt-0.5">
                {employee.employeeCode} &bull; {employee.workEmail}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300">
                <span className="rounded-md bg-slate-800/80 px-2.5 py-1">
                  Departemen: <strong className="text-white">{employee.departmentName ?? '—'}</strong>
                </span>
                <span className="rounded-md bg-slate-800/80 px-2.5 py-1">
                  Peran: <strong className="text-white">{employee.jobRoleTitle ?? '—'}</strong>
                </span>
              </div>
            </div>
          </div>

          {canManage && (
            <Button
              id="resource-detail-edit-button"
              variant="secondary"
              onClick={() => setIsEditModalOpen(true)}
            >
              Edit Profil
            </Button>
          )}
        </div>
      </Card>

      {/* Workload & Capacity Evaluation Section */}
      <ResourceCapacityCard
        currentAllocation={employee.currentAllocation ?? 0}
        currentRemainingCapacity={employee.currentRemainingCapacity ?? 100}
        evaluatedPeriod={evaluated}
        onEvaluateRange={(start, end) => setDateRange({ startDate: start, endDate: end })}
      />

      {/* Skills Inventory Section */}
      <ResourceSkillsCard skills={employee.skills ?? []} />

      {/* Project Allocations History Section */}
      <ResourceAllocationsTable allocations={employee.allocations ?? []} />

      {/* Edit Modal */}
      {isEditModalOpen && (
        <ResourceFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          resourceToEdit={employee}
          departments={departmentsQuery.data ?? []}
          jobRoles={jobRolesQuery.data ?? []}
          onSubmit={handleEditSubmit}
        />
      )}
    </div>
  )
}
