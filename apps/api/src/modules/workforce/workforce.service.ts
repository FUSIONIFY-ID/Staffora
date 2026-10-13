import { z } from 'zod'
import { Prisma } from '../../generated/prisma/client.js'
import { ConflictError, NotFoundError, ValidationError } from '../../common/errors/app-error.js'
import type { AuthenticatedUser } from '../../common/auth/types.js'
import {
  createDepartmentSchema,
  createEmployeeSchema,
  createJobRoleSchema,
  employeeDetailQuerySchema,
  employeeIdParamsSchema,
  queryEmployeesSchema,
  updateEmployeeSchema,
} from './workforce.schema.js'
import type { EmployeeDetailQuery, EmployeeListQuery } from './workforce.schema.js'
import { workforceRepository } from './workforce.repository.js'
import { toDateString } from '../capacity/capacity.service.js'
import { toDetailView, toEmployeeView } from './workforce.views.js'
import { workforcePolicy } from './workforce.policy.js'
import type {
  CapacityWindow,
  EmployeeDetail,
  EmployeeSummaryRecord,
  EmployeeView,
} from './workforce.types.js'

const EMPLOYEE_NOT_FOUND = 'Employee profile was not found.'

export function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'root'
    if (!formatted[key]) {
      formatted[key] = []
    }
    formatted[key].push(issue.message)
  }
  return formatted
}

/**
 * The shared validateQuery/validateParams middleware in
 * common/validation/validate.ts assigns to req.query / req.params, which
 * Express 5 exposes as getter-only properties. Every request whose schema
 * parses successfully therefore fails with a 500. Until that middleware is
 * fixed, the workforce routes validate in the module and never write back to
 * the request object.
 */
function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, label: string): T {
  const result = schema.safeParse(value)
  if (!result.success) {
    throw new ValidationError(`Validation failed for ${label}.`, formatZodErrors(result.error))
  }
  return result.data
}

function parseListQuery(query: unknown): EmployeeListQuery {
  return parseOrThrow(queryEmployeesSchema, query, 'query parameters')
}

function parseDetailQuery(query: unknown): EmployeeDetailQuery {
  return parseOrThrow(employeeDetailQuerySchema, query, 'query parameters')
}

function parseEmployeeId(params: unknown): string {
  return parseOrThrow(employeeIdParamsSchema, params, 'path parameters').id
}

/** Default capacity window is the single day of today (AC04.04). */
function toCapacityWindow(query: EmployeeDetailQuery): CapacityWindow {
  const today = toDateString(new Date())
  return {
    startDate: query.startDate ?? today,
    endDate: query.endDate ?? query.startDate ?? today,
  }
}

/**
 * Maps a Prisma unique-constraint violation to a 409.
 *
 * The pre-flight existence checks are not atomic: two concurrent creates with
 * the same code both pass the check and one of them then violates the
 * constraint. Without this mapping that race surfaced as HTTP 500.
 */
function mapUniqueViolation(error: unknown, fieldCodes: Record<string, string>, message: string): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    const target = error.meta?.target
    const fields = Array.isArray(target) ? target.map(String) : [String(target ?? '')]
    const matched = fields.map((field) => fieldCodes[field]).find((code) => code !== undefined)
    throw new ConflictError(message, matched ?? 'DUPLICATE_RESOURCE')
  }
  throw error
}

async function assertReferencesExist(departmentId?: string, jobRoleId?: string): Promise<void> {
  const [department, jobRole] = await Promise.all([
    departmentId ? workforceRepository.findDepartmentById(departmentId) : undefined,
    jobRoleId ? workforceRepository.findJobRoleById(jobRoleId) : undefined,
  ])

  if (departmentId && !department) {
    throw new ValidationError('Department and job role must exist.', {
      departmentId: ['Department could not be found.'],
    })
  }
  if (jobRoleId && !jobRole) {
    throw new ValidationError('Department and job role must exist.', {
      jobRoleId: ['Job role could not be found.'],
    })
  }
}

function toSummaryView(employee: EmployeeSummaryRecord): EmployeeView {
  return toEmployeeView(employee, toDateString(new Date()))
}

export const workforceService = {
  async getDepartments(): Promise<Array<{ id: string; name: string; isActive: boolean }>> {
    return workforceRepository.listDepartments()
  },

  async createDepartment(body: unknown, actorId?: string): Promise<{ id: string; name: string; isActive: boolean }> {
    const data = parseOrThrow(createDepartmentSchema, body, 'request body')

    // ERD 2.3: department names are unique on a normalised, case-insensitive basis.
    if (await workforceRepository.findDepartmentByName(data.name)) {
      throw new ConflictError('A department with this name already exists.', 'DUPLICATE_DEPARTMENT_NAME')
    }

    try {
      return await workforceRepository.createDepartment(data.name, actorId)
    } catch (error) {
      return mapUniqueViolation(error, { name: 'DUPLICATE_DEPARTMENT_NAME' }, 'A department with this name already exists.')
    }
  },

  async getJobRoles(): Promise<Array<{ id: string; name: string; isActive: boolean }>> {
    return workforceRepository.listJobRoles()
  },

  async createJobRole(body: unknown, actorId?: string): Promise<{ id: string; name: string; isActive: boolean }> {
    const data = parseOrThrow(createJobRoleSchema, body, 'request body')

    if (await workforceRepository.findJobRoleByName(data.name)) {
      throw new ConflictError('A job role with this title already exists.', 'DUPLICATE_JOB_ROLE_NAME')
    }

    try {
      return await workforceRepository.createJobRole(data.name, actorId)
    } catch (error) {
      return mapUniqueViolation(error, { name: 'DUPLICATE_JOB_ROLE_NAME' }, 'A job role with this title already exists.')
    }
  },

  async getEmployees(query: unknown): Promise<{
    data: EmployeeView[]
    total: number
    page: number
    pageSize: number
  }> {
    const { search, departmentId, jobRoleId, status, page, pageSize } = parseListQuery(query)

    const searchTerm = search?.trim()
    const where: Prisma.EmployeeWhereInput = {
      ...(searchTerm
        ? {
            OR: [
              { fullName: { contains: searchTerm, mode: 'insensitive' } },
              { employeeCode: { contains: searchTerm, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(departmentId ? { departmentId } : {}),
      ...(jobRoleId ? { jobRoleId } : {}),
      ...(status ? { status } : {}),
    }

    const [rows, total] = await Promise.all([
      workforceRepository.listEmployees(where, (page - 1) * pageSize, pageSize),
      workforceRepository.countEmployees(where),
    ])

    return {
      // PRD US02.01 - AC01.03 requires a current availability indicator on each
      // row, so the figure comes from allocation effective today.
      data: rows.map(toSummaryView),
      total,
      page,
      pageSize,
    }
  },

  async createEmployee(body: unknown, actorId?: string): Promise<EmployeeView> {
    const data = parseOrThrow(createEmployeeSchema, body, 'request body')
    const workEmail = data.workEmail.toLowerCase()

    const [byCode, byEmail] = await Promise.all([
      workforceRepository.findEmployeeByCode(data.employeeCode),
      workforceRepository.findEmployeeByEmail(workEmail),
    ])

    if (byCode) {
      throw new ConflictError('An employee with this code already exists.', 'DUPLICATE_EMPLOYEE_CODE')
    }
    if (byEmail) {
      throw new ConflictError('An employee with this work email already exists.', 'DUPLICATE_WORK_EMAIL')
    }

    await assertReferencesExist(data.departmentId, data.jobRoleId)

    try {
      const employee = await workforceRepository.createEmployee({
        employeeCode: data.employeeCode,
        fullName: data.fullName,
        workEmail,
        departmentId: data.departmentId,
        jobRoleId: data.jobRoleId,
        status: data.status,
        createdBy: actorId,
      })
      return toSummaryView(employee)
    } catch (error) {
      return mapUniqueViolation(
        error,
        { employeeCode: 'DUPLICATE_EMPLOYEE_CODE', workEmail: 'DUPLICATE_WORK_EMAIL' },
        'An employee with this code or work email already exists.',
      )
    }
  },

  async getEmployeeDetail(
    params: unknown,
    query: unknown,
    user: AuthenticatedUser,
  ): Promise<EmployeeDetail> {
    const id = parseEmployeeId(params)
    const window = toCapacityWindow(parseDetailQuery(query))

    const employee = await workforceRepository.findEmployeeDetail(id)

    // A missing record and a record the caller may not see both answer 404, so
    // the response cannot be used to enumerate employee IDs.
    if (!employee) {
      throw new NotFoundError(EMPLOYEE_NOT_FOUND)
    }
    workforcePolicy.assertCanViewEmployee(user, employee.id)

    return toDetailView(employee, window)
  },

  async updateEmployee(params: unknown, body: unknown, actorId?: string): Promise<EmployeeView> {
    const id = parseEmployeeId(params)
    const existing = await workforceRepository.findEmployeeById(id)
    if (!existing) {
      throw new NotFoundError(EMPLOYEE_NOT_FOUND)
    }

    const data = parseOrThrow(updateEmployeeSchema, body, 'request body')
    await assertReferencesExist(data.departmentId, data.jobRoleId)

    const updated = await workforceRepository.updateEmployee(id, {
      ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
      ...(data.departmentId !== undefined ? { departmentId: data.departmentId } : {}),
      ...(data.jobRoleId !== undefined ? { jobRoleId: data.jobRoleId } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      updatedBy: actorId,
    })

    return toSummaryView(updated)
  },
}
