import { z } from 'zod'

const EMPLOYEE_CODE_PATTERN = /^[A-Z0-9][A-Z0-9-]*$/

// Identity fields are optional here because UpdateEmployeeInput cannot persist
// them; create mode requires them again via the extended schema below.
export const employeeFormSchema = z.object({
  employeeCode: z
    .string()
    .trim()
    .min(1, 'Employee code is required.')
    .max(50, 'Employee code must be 50 characters or fewer.')
    .regex(
      EMPLOYEE_CODE_PATTERN,
      'Use uppercase letters, digits or hyphens only (for example EMP001).',
    )
    .optional(),
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters.')
    .max(255, 'Full name must be 255 characters or fewer.'),
  workEmail: z
    .string()
    .trim()
    .min(1, 'Work email is required.')
    .pipe(z.email('Enter a valid work email address.'))
    .optional(),
  departmentId: z.uuid('Select a department.'),
  jobRoleId: z.uuid('Select a job role.'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
})

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>

export const createEmployeeFormSchema = employeeFormSchema.extend({
  employeeCode: z
    .string()
    .trim()
    .min(1, 'Employee code is required.')
    .max(50, 'Employee code must be 50 characters or fewer.')
    .regex(
      EMPLOYEE_CODE_PATTERN,
      'Use uppercase letters, digits or hyphens only (for example EMP001).',
    ),
  workEmail: z
    .string()
    .trim()
    .min(1, 'Work email is required.')
    .pipe(z.email('Enter a valid work email address.')),
})

export type CreateEmployeeFormValues = z.infer<typeof createEmployeeFormSchema>

export interface EmployeeFormState {
  employeeCode: string
  fullName: string
  workEmail: string
  departmentId: string
  jobRoleId: string
  status: 'ACTIVE' | 'INACTIVE'
}

export const EMPTY_EMPLOYEE_FORM: EmployeeFormState = {
  employeeCode: '',
  fullName: '',
  workEmail: '',
  departmentId: '',
  jobRoleId: '',
  status: 'ACTIVE',
}
