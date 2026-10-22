import { useCallback, useState } from 'react'
import type { Employee, EmployeeStatus } from '../api/resources-api.js'
import { useCreateEmployee, useUpdateEmployee } from './use-resources.js'
import { normalizeError, type NormalizedError } from '../lib/normalize-error.js'
import type { CreateEmployeeFormValues } from '../lib/resource-form-schema.js'

export interface ResourceFormController {
  isOpen: boolean
  editing: Employee | null
  isSubmitting: boolean
  error: NormalizedError | null
  successMessage: string | null
  openCreate: () => void
  openEdit: (employee: Employee) => void
  close: () => void
  submit: (values: CreateEmployeeFormValues, employeeId?: string) => void
  dismissSuccess: () => void
}

function toStatus(value: string): EmployeeStatus {
  return value === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'
}

// The modal stays open when a mutation fails so typed values survive; it only
// closes after a successful save.
export function useResourceForm(): ResourceFormController {
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [error, setError] = useState<NormalizedError | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const createMutation = useCreateEmployee()
  const updateMutation = useUpdateEmployee()

  const openCreate = useCallback(() => {
    setEditing(null)
    setError(null)
    setIsOpen(true)
  }, [])

  const openEdit = useCallback((employee: Employee) => {
    setEditing(employee)
    setError(null)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setError(null)
    setEditing(null)
  }, [])

  const submit = useCallback(
    (values: CreateEmployeeFormValues, employeeId?: string) => {
      setError(null)

      const onSuccess = (fullName: string) => {
        setSuccessMessage(
          employeeId
            ? `${fullName}'s profile was updated.`
            : `${fullName} was added to the resource directory.`,
        )
        setIsOpen(false)
        setEditing(null)
      }

      const onError = (caught: unknown) => {
        setError(normalizeError(caught))
      }

      if (employeeId) {
        // `UpdateEmployeeInput` cannot carry code or email, so only the mutable
        // fields are sent. Sending them would be rejected as unknown keys.
        updateMutation.mutate(
          {
            employeeId,
            input: {
              fullName: values.fullName,
              departmentId: values.departmentId,
              jobRoleId: values.jobRoleId,
              status: toStatus(values.status),
            },
          },
          { onSuccess: () => onSuccess(values.fullName), onError },
        )
        return
      }

      createMutation.mutate(
        {
          employeeCode: values.employeeCode,
          fullName: values.fullName,
          workEmail: values.workEmail,
          departmentId: values.departmentId,
          jobRoleId: values.jobRoleId,
          status: toStatus(values.status),
        },
        { onSuccess: () => onSuccess(values.fullName), onError },
      )
    },
    [createMutation, updateMutation],
  )

  const dismissSuccess = useCallback(() => setSuccessMessage(null), [])

  return {
    isOpen,
    editing,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    error,
    successMessage,
    openCreate,
    openEdit,
    close,
    submit,
    dismissSuccess,
  }
}
