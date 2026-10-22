import { z } from 'zod'

/**
 * Employee code: uppercase letters, digits and hyphens only (e.g. `EMP001`,
 * `EMP-ADM01`). The backend column is free-form text, so this constraint lives
 * on the client to keep new records consistent with existing seeded codes. It
 * never rejects the format the seed data already uses.
 */
const EMPLOYEE_CODE_PATTERN = /^[A-Z0-9][A-Z0-9-]*$/

/**
 * Validation contract for the create/edit resource form (PRD US02.01 - AC02).
 *
 * `employeeCode` and `workEmail` are part of the create payload only. The
 * OpenAPI `UpdateEmployeeInput` deliberately omits them, so the edit form marks
 * those inputs read-only and this schema keeps them optional — validating a
 * field the API cannot persist would be a false promise to the user.
 */
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

/** Create mode requires the two immutable-after-creation identity fields. */
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

/** Form state used by React Hook Form in both modes. */
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
