import React, { useState } from 'react'
import { useParams, Link } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, ApiError } from '../../api/client.js'
import { useAuth } from '../../app/providers/auth-provider.js'
import { Button } from '../../components/ui/button.js'
import { Spinner } from '../../components/ui/spinner.js'
import { Alert } from '../../components/ui/alert.js'
import { ResourceSkillsCard } from './components/resource-skills-card.js'
import { ResourceAllocationsTable } from './components/resource-allocations-table.js'
import { ResourceCapacityCard } from './components/resource-capacity-card.js'
import { ResourceFormModal, type ResourceFormData } from './components/resource-form-modal.js'
import type { ResourceDetailItem, DepartmentItem, JobRoleItem, EvaluatedCapacity } from './components/types.js'

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
    queryFn: async () => (await apiClient<{ data: DepartmentItem[] }>('/departments')).data ?? [],
    enabled: canManage,
  })

  const jobRolesQuery = useQuery({
    queryKey: ['job-roles'],
    queryFn: async () => (await apiClient<{ data: JobRoleItem[] }>('/job-roles')).data ?? [],
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
      void queryClient.invalidateQueries({ queryKey: ['capacity'] })
      setFeedback({ type: 'success', message: 'Profil karyawan berhasil diperbarui.' })
    },
  })

  if (detailQuery.isLoading) {
    return (
      <div className="flex min-h-96 flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm font-medium text-slate-400">Memuat profil karyawan...</p>
      </div>
    )
  }

  if (detailQuery.isError) {
    const error = detailQuery.error
    const is404 = error instanceof ApiError && error.status === 404
    const is403 = error instanceof ApiError && error.status === 403
    return (
      <div className="space-y-6">
        <Link to="/resources" className="text-xs font-semibold text-blue-500 hover:underline">
          &larr; Kembali ke Direktori Karyawan
        </Link>
        <Alert type="error" title={is404 ? 'Karyawan Tidak Ditemukan' : is403 ? 'Akses Ditolak' : 'Gagal Memuat Profil'}>
          {is404 ? 'Profil karyawan yang diminta tidak ditemukan dalam basis data sistem.' : is403 ? 'Anda tidak memiliki wewenang untuk melihat profil sumber daya ini.' : error?.message || 'Terjadi kesalahan jaringan atau server saat memuat profil karyawan.'}
          {!is404 && !is403 && (
            <Button size="sm" variant="outline" className="ml-2 mt-2 block" onClick={() => void detailQuery.refetch()}>
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
    ? employee.fullName.split(' ').filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : 'EM'

  const evaluated: EvaluatedCapacity | undefined = employee.evaluatedPeriod ?? {
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    peakConcurrentAllocation: employee.currentAllocation ?? 0,
    remainingCapacity: employee.currentRemainingCapacity ?? 100,
  }

  return (
    <div className="space-y-6">
      {feedback && (
        <Alert type={feedback.type} title={feedback.type === 'success' ? 'Berhasil' : 'Kesalahan'}>
          {feedback.message}
        </Alert>
      )}

      {/* Inactive Employee Warning Banner */}
      {employee.status === 'INACTIVE' && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 shadow-xs">
          <span className="text-base">⚠️</span>
          <div>
            <strong>Karyawan Berstatus Non-Aktif:</strong> Karyawan ini tidak dapat dialokasikan pada proyek baru. Seluruh data historis alokasi proyek dan keahlian tetap disimpan untuk kebutuhan pelaporan dan audit.
          </div>
        </div>
      )}

      {/* Page Title & Subtitle matching Figma */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{employee.fullName}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {employee.employeeCode} &middot; {employee.jobRoleTitle ?? 'Software Engineer'} &middot; {employee.departmentName ?? 'Engineering'}
          </p>
        </div>

        {canManage && (
          <Button
            id="resource-detail-edit-button"
            variant="secondary"
            onClick={() => setIsEditModalOpen(true)}
            className="w-full sm:w-auto bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs font-medium text-xs sm:text-sm"
          >
            Edit Profil
          </Button>
        )}
      </div>

      {/* Row 1: Profile Info Card (Left) & Skills & Proficiency Card (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Card: Profile Details matching Figma */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-xl">
              {initials}
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-600 font-medium">{employee.workEmail}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6 mt-6 border-t border-slate-100">
            <div>
              <span className="block text-xs font-medium text-slate-400">Department</span>
              <p className="text-sm font-semibold text-slate-900 mt-1">{employee.departmentName ?? 'Engineering'}</p>
            </div>
            <div>
              <span className="block text-xs font-medium text-slate-400">Employment</span>
              <div className="mt-1">
                <span className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium ${
                  employee.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {employee.status === 'ACTIVE' ? 'Active' : 'Non-Aktif'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Skills & Proficiency */}
        <div className="lg:col-span-7">
          <ResourceSkillsCard skills={employee.skills ?? []} />
        </div>
      </div>

      {/* Row 2: Current Capacity */}
      <ResourceCapacityCard
        currentAllocation={employee.currentAllocation ?? 0}
        currentRemainingCapacity={employee.currentRemainingCapacity ?? 100}
        evaluatedPeriod={evaluated}
        onEvaluateRange={(start, end) => setDateRange({ startDate: start, endDate: end })}
      />

      {/* Row 3: Project Allocations Table */}
      <ResourceAllocationsTable allocations={employee.allocations ?? []} />

      {/* Edit Modal */}
      {isEditModalOpen && (
        <ResourceFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          resourceToEdit={employee}
          departments={departmentsQuery.data ?? []}
          jobRoles={jobRolesQuery.data ?? []}
          onSubmit={async (data) => {
            await updateMutation.mutateAsync(data)
          }}
        />
      )}
    </div>
  )
}
