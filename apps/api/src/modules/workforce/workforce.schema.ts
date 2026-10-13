import { z } from 'zod'

/**
 * Master-data names are normalised before storage: trimmed and with internal
 * whitespace collapsed. The ERD (docs/database/erd.md 2.3) requires the
 * department and job role `name` to be unique on a normalised, case-insensitive
 * basis, so uniqueness is checked separately with a case-insensitive lookup.
 */
const normalizedName = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(255)
    .transform((value) => value.replace(/\s+/g, ' '))

export const createDepartmentSchema = z.object({
  name: normalizedName('Department name'),
})

export const createJobRoleSchema = z.object({
  name: normalizedName('Job role title'),
})

export const createEmployeeSchema = z.object({
  employeeCode: z.string().trim().min(1, 'Employee code is required').max(50),
  fullName: z.string().trim().min(1, 'Full name is required').max(255),
  workEmail: z.email('Valid work email is required'),
  departmentId: z.uuid('Valid department ID is required'),
  jobRoleId: z.uuid('Valid job role ID is required'),
  // PRD US02.01 - AC02.02 lists Employment Status as a required field, and
  // OpenAPI CreateEmployeeInput marks it required. No default is applied.
  status: z.enum(['ACTIVE', 'INACTIVE']),
})

export const updateEmployeeSchema = z
  .object({
    fullName: z.string().trim().min(1).max(255).optional(),
    departmentId: z.uuid().optional(),
    jobRoleId: z.uuid().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided.',
  })

export const queryEmployeesSchema = z.object({
  search: z.string().trim().optional(),
  departmentId: z.uuid().optional(),
  jobRoleId: z.uuid().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

/**
 * Path parameter for the employee detail and update routes.
 *
 * An unvalidated `:id` reaches Prisma and produces P2007
 * ("invalid input syntax for type uuid"), which surfaced as HTTP 500.
 */
export const employeeIdParamsSchema = z.object({
  id: z.uuid('A valid employee ID is required.'),
})

/**
 * Optional capacity window for the employee detail route, per PRD US02.01 -
 * AC04.04 ("allocation effective today, or peak concurrent allocation and
 * remaining capacity for a selected date range"). Defaults to a single day,
 * today, when omitted.
 */
export const employeeDetailQuerySchema = z
  .object({
    startDate: z.iso.date('startDate must be an ISO date (YYYY-MM-DD).').optional(),
    endDate: z.iso.date('endDate must be an ISO date (YYYY-MM-DD).').optional(),
  })
  .refine((value) => !value.startDate || !value.endDate || value.endDate >= value.startDate, {
    message: 'endDate must be on or after startDate.',
    path: ['endDate'],
  })

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>
export type EmployeeListQuery = z.infer<typeof queryEmployeesSchema>
export type EmployeeDetailQuery = z.infer<typeof employeeDetailQuerySchema>
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>
export type CreateJobRoleInput = z.infer<typeof createJobRoleSchema>
