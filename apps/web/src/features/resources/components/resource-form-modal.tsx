import React, { useState, useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '../../../components/ui/modal.js'
import { Button } from '../../../components/ui/button.js'
import { Input } from '../../../components/ui/input.js'
import { Alert } from '../../../components/ui/alert.js'
import { ApiError } from '../../../api/client.js'
import { FormSelect } from './form-select.js'
import type { DepartmentItem, JobRoleItem, ResourceItem } from './types.js'

const resourceSchema = z.object({
  employeeCode: z
    .string()
    .min(1, 'Kode karyawan wajib diisi')
    .max(50, 'Kode karyawan maksimal 50 karakter'),
  fullName: z
    .string()
    .min(2, 'Nama lengkap minimal 2 karakter')
    .max(255, 'Nama lengkap maksimal 255 karakter'),
  workEmail: z.string().email('Format email kerja tidak valid'),
  departmentId: z.string().min(1, 'Departemen wajib dipilih'),
  jobRoleId: z.string().min(1, 'Peran/jabatan wajib dipilih'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
})

export type ResourceFormData = z.infer<typeof resourceSchema>

export interface ResourceFormModalProps {
  isOpen: boolean
  onClose: () => void
  resourceToEdit: ResourceItem | null
  departments: DepartmentItem[]
  jobRoles: JobRoleItem[]
  isDepartmentsLoading?: boolean
  departmentsError?: Error | null
  onRetryDepartments?: () => void
  isJobRolesLoading?: boolean
  jobRolesError?: Error | null
  onRetryJobRoles?: () => void
  onSubmit: (data: ResourceFormData) => Promise<void>
}

export const ResourceFormModal: React.FC<ResourceFormModalProps> = ({
  isOpen,
  onClose,
  resourceToEdit,
  departments,
  jobRoles,
  isDepartmentsLoading = false,
  departmentsError = null,
  onRetryDepartments,
  isJobRolesLoading = false,
  jobRolesError = null,
  onRetryJobRoles,
  onSubmit,
}): React.JSX.Element => {
  const isEditing = Boolean(resourceToEdit)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<ResourceFormData>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      employeeCode: '',
      fullName: '',
      workEmail: '',
      departmentId: '',
      jobRoleId: '',
      status: 'ACTIVE',
    },
  })

  const isResetDoneRef = React.useRef(false)

  // Initialize form once when modal opens without wiping user edits on subsequent re-renders
  useEffect(() => {
    if (isOpen) {
      if (!isResetDoneRef.current) {
        if (resourceToEdit) {
          reset({
            employeeCode: resourceToEdit.employeeCode,
            fullName: resourceToEdit.fullName,
            workEmail: resourceToEdit.workEmail,
            departmentId: resourceToEdit.departmentId,
            jobRoleId: resourceToEdit.jobRoleId,
            status: resourceToEdit.status,
          })
        } else {
          reset({
            employeeCode: '',
            fullName: '',
            workEmail: '',
            departmentId: departments[0]?.id ?? '',
            jobRoleId: jobRoles[0]?.id ?? '',
            status: 'ACTIVE',
          })
        }
        isResetDoneRef.current = true
      }
    } else {
      isResetDoneRef.current = false
    }
  }, [isOpen, resourceToEdit, reset, departments, jobRoles])

  // If options load asynchronously after open, populate without wiping other inputs
  useEffect(() => {
    if (isOpen && !resourceToEdit) {
      if (departments.length > 0 && !getValues('departmentId')) {
        setValue('departmentId', departments[0].id)
      }
      if (jobRoles.length > 0 && !getValues('jobRoleId')) {
        setValue('jobRoleId', jobRoles[0].id)
      }
    }
  }, [isOpen, resourceToEdit, departments, jobRoles, getValues, setValue])

  const currentStatus = useWatch({
    control,
    name: 'status',
    defaultValue: 'ACTIVE',
  })

  const handleFormSubmit = async (data: ResourceFormData): Promise<void> => {
    setServerError(null)
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      onClose()
    } catch (err: unknown) {
      if (err instanceof ApiError && (err.status === 409 || err.code === 'CONFLICT')) {
        setServerError(
          err.message || 'Kode karyawan atau email kerja sudah terdaftar dalam sistem. Gunakan kode atau email yang berbeda.',
        )
        return
      }
      const msg = (err as Error)?.message || 'Gagal menyimpan data karyawan.'
      setServerError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Profil Karyawan' : 'Tambah Karyawan Baru'}
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {serverError && (
          <Alert type="error" title="Gagal Menyimpan">
            {serverError}
          </Alert>
        )}

        {(departmentsError || jobRolesError) && (
          <Alert type="warning" title="Data Master Belum Lengkap">
            Gagal memuat opsi departemen atau peran.{' '}
            {onRetryDepartments && (
              <Button type="button" size="sm" variant="outline" className="mr-2 mt-1" onClick={onRetryDepartments}>
                Ulangi Departemen
              </Button>
            )}
            {onRetryJobRoles && (
              <Button type="button" size="sm" variant="outline" className="mt-1" onClick={onRetryJobRoles}>
                Ulangi Peran
              </Button>
            )}
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Employee Code */}
          <Input
            id="resource-form-code"
            label="Kode Karyawan"
            placeholder="e.g. EMP001"
            disabled={isEditing}
            error={errors.employeeCode?.message}
            {...register('employeeCode')}
          />

          {/* Full Name */}
          <Input
            id="resource-form-name"
            label="Nama Lengkap"
            placeholder="Nama lengkap..."
            error={errors.fullName?.message}
            {...register('fullName')}
          />

          {/* Work Email */}
          <Input
            id="resource-form-email"
            label="Email Kerja"
            type="email"
            placeholder="nama@staffora.internal"
            disabled={isEditing}
            error={errors.workEmail?.message}
            {...register('workEmail')}
          />

          {/* Employment Status */}
          <div className="w-full space-y-1.5 text-left">
            <label htmlFor="resource-form-status" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Status Kerja
            </label>
            <select
              id="resource-form-status"
              className="w-full rounded-lg bg-slate-900/80 border border-slate-700/80 px-3.5 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              {...register('status')}
            >
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Non-Aktif</option>
            </select>
          </div>

          {/* Department */}
          <FormSelect
            id="resource-form-department"
            label="Departemen"
            placeholder={isDepartmentsLoading ? 'Memuat departemen...' : 'Pilih Departemen'}
            options={departments}
            registration={register('departmentId')}
            disabled={isDepartmentsLoading}
            error={errors.departmentId?.message}
          />

          {/* Job Role */}
          <FormSelect
            id="resource-form-role"
            label="Peran / Jabatan"
            placeholder={isJobRolesLoading ? 'Memuat peran...' : 'Pilih Peran'}
            options={jobRoles.map((r) => ({ id: r.id, name: r.title || r.name }))}
            registration={register('jobRoleId')}
            disabled={isJobRolesLoading}
            error={errors.jobRoleId?.message}
          />
        </div>

        {currentStatus === 'INACTIVE' && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
            ⚠️ <strong>Perhatian:</strong> Menetapkan status Non-Aktif akan mencegah karyawan dialokasikan pada proyek baru, namun riwayat alokasi sebelumnya tetap dipertahankan untuk audit historis.
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            id="resource-form-submit"
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
          >
            {isEditing ? 'Perbarui Karyawan' : 'Tambah Karyawan'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
