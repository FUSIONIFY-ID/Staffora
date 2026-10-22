import React, { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type Resolver } from 'react-hook-form'
import { Alert } from '../../../components/ui/alert.js'
import { Button } from '../../../components/ui/button.js'
import { Input } from '../../../components/ui/input.js'
import { Modal } from '../../../components/ui/modal.js'
import { Select } from '../../../components/ui/select.js'
import type { Department, Employee, JobRole } from '../api/resources-api.js'
import {
  EMPTY_EMPLOYEE_FORM,
  createEmployeeFormSchema,
  type CreateEmployeeFormValues,
} from '../lib/resource-form-schema.js'

export interface ResourceFormModalProps {
  isOpen: boolean
  employee?: Employee | null
  departments: Department[]
  jobRoles: JobRole[]
  isSubmitting: boolean
  submitError?: string | null
  fieldErrors?: Record<string, string[]>
  onClose: () => void
  onSubmit: (values: CreateEmployeeFormValues, employeeId?: string) => void
}

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
]

const FORM_FIELDS = [
  'employeeCode',
  'fullName',
  'workEmail',
  'departmentId',
  'jobRoleId',
  'status',
] as const

type FormFieldName = (typeof FORM_FIELDS)[number]

function isFormField(field: string): field is FormFieldName {
  return (FORM_FIELDS as readonly string[]).includes(field)
}

// employeeCode and workEmail are disabled in edit mode because
// UpdateEmployeeInput cannot persist them. Uniqueness is decided by the backend,
// so those messages are mapped back onto the matching input on failure.
export const ResourceFormModal: React.FC<ResourceFormModalProps> = ({
  isOpen,
  employee,
  departments,
  jobRoles,
  isSubmitting,
  submitError,
  fieldErrors,
  onClose,
  onSubmit,
}) => {
  const isEditMode = Boolean(employee)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateEmployeeFormValues>({
    resolver: zodResolver(createEmployeeFormSchema) as Resolver<CreateEmployeeFormValues>,
    defaultValues: EMPTY_EMPLOYEE_FORM,
    mode: 'onBlur',
  })

  // Reload values whenever the modal opens for a different record so stale
  // input from a previous edit can never leak into the next submission.
  useEffect(() => {
    if (!isOpen) return

    reset(
      employee
        ? {
            employeeCode: employee.employeeCode,
            fullName: employee.fullName,
            workEmail: employee.workEmail,
            departmentId: employee.departmentId,
            jobRoleId: employee.jobRoleId,
            status: employee.status,
          }
        : EMPTY_EMPLOYEE_FORM,
    )
  }, [isOpen, employee, reset])

  // Map API field errors onto their inputs once the mutation fails.
  useEffect(() => {
    if (!fieldErrors) return

    for (const [field, messages] of Object.entries(fieldErrors)) {
      const message = messages[0]
      if (!message || !isFormField(field)) continue
      setError(field, { type: 'server', message })
    }
  }, [fieldErrors, setError])

  const submitHandler = handleSubmit((values) => {
    onSubmit(values, employee?.id)
  })

  const departmentOptions = departments.map((department) => ({
    value: department.id,
    label: department.name,
  }))

  const jobRoleOptions = jobRoles.map((jobRole) => ({
    value: jobRole.id,
    label: jobRole.name,
  }))

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={isEditMode ? `Edit ${employee?.fullName ?? 'resource'}` : 'Add new resource'}
    >
      <form onSubmit={submitHandler} className="space-y-4" noValidate>
        {submitError && (
          <Alert type="error" title="Could not save the resource">
            {submitError}
          </Alert>
        )}

        {isEditMode && (
          <Alert type="info">
            Employee code and work email are fixed after creation and cannot be edited here.
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="resource-employee-code"
            label="Employee code"
            placeholder="EMP001"
            readOnly={isEditMode}
            disabled={isEditMode}
            error={errors.employeeCode?.message}
            {...register('employeeCode')}
          />

          <Input
            id="resource-full-name"
            label="Full name"
            placeholder="Budi Santoso"
            error={errors.fullName?.message}
            {...register('fullName')}
          />

          <Input
            id="resource-work-email"
            label="Work email"
            type="email"
            placeholder="name@staffora.internal"
            readOnly={isEditMode}
            disabled={isEditMode}
            error={errors.workEmail?.message}
            {...register('workEmail')}
          />

          <Select
            id="resource-form-status"
            label="Employment status"
            options={STATUS_OPTIONS}
            error={errors.status?.message}
            {...register('status')}
          />

          <Select
            id="resource-form-department"
            label="Department"
            placeholder="Select a department"
            options={departmentOptions}
            error={errors.departmentId?.message}
            {...register('departmentId')}
          />

          <Select
            id="resource-form-job-role"
            label="Job role"
            placeholder="Select a job role"
            options={jobRoleOptions}
            error={errors.jobRoleId?.message}
            {...register('jobRoleId')}
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
            {isEditMode ? 'Save changes' : 'Create resource'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
