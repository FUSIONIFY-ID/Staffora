import { z } from 'zod'
import { ConflictError, NotFoundError, ValidationError } from '../../common/errors/app-error.js'
import {
  createDepartmentSchema,
  createEmployeeSchema,
  createJobRoleSchema,
  queryEmployeesSchema,
  updateEmployeeSchema,
} from './workforce.schema.js'
import type { EmployeeListQuery } from './workforce.schema.js'
import { workforceRepository } from './workforce.repository.js'
import { toDetailView, toEmployeeView, evaluateRemainingCapacity } from './workforce.views.js'

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

function parseListQuery(query: unknown): EmployeeListQuery {
  const result = queryEmployeesSchema.safeParse(query)
  if (!result.success) {
    throw new ValidationError('Validation failed for query parameters.', formatZodErrors(result.error))
  }
  return result.data
}

function parseUpdateBody(body: unknown): z.infer<typeof updateEmployeeSchema> {
  try {
    return updateEmployeeSchema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation failed for request body.', formatZodErrors(error))
    }
    throw error
  }
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

export const workforceService = {
  async getDepartments(): Promise<Awaited<ReturnType<typeof workforceRepository.listDepartments>>> {
    return workforceRepository.listDepartments()
  },

  async createDepartment(body: unknown, actorId?: string) {
    const data = createDepartmentSchema.parse(body)
    return workforceRepository.createDepartment(data.name, actorId)
  },

  async getJobRoles(): Promise<Awaited<ReturnType<typeof workforceRepository.listJobRoles>>> {
    return workforceRepository.listJobRoles()
  },

  async createJobRole(body: unknown, actorId?: string) {
    const data = createJobRoleSchema.parse(body)
    return workforceRepository.createJobRole(data.name, actorId)
  },

  async getEmployees(query: unknown) {
    const { search, departmentId, jobRoleId, status, page, pageSize } = parseListQuery(query)

    const searchTerm = search?.trim()
    const where = {
      ...(searchTerm
        ? {
            OR: [
              { fullName: { contains: searchTerm, mode: 'insensitive' as const } },
              { employeeCode: { contains: searchTerm, mode: 'insensitive' as const } },
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
      // row. evaluateRemainingCapacity is the same helper the detail view uses, so the
      // indicator and AC04.04 cannot drift apart.
      data: rows.map((row) =>
        toEmployeeView(row, evaluateRemainingCapacity(row.allocations).remainingCapacity),
      ),
      total,
      page,
      pageSize,
    }
  },

  async createEmployee(body: unknown, actorId?: string) {
    const data = createEmployeeSchema.parse(body)
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

    const employee = await workforceRepository.createEmployee({
      employeeCode: data.employeeCode,
      fullName: data.fullName,
      workEmail,
      departmentId: data.departmentId,
      jobRoleId: data.jobRoleId,
      status: data.status,
      createdBy: actorId,
    })

    return toEmployeeView(employee, evaluateRemainingCapacity(employee.allocations).remainingCapacity)
  },

  async getEmployeeDetail(id: string) {
    const employee = await workforceRepository.findEmployeeDetail(id)
    if (!employee) {
      return null
    }
    return toDetailView(employee)
  },

  async updateEmployee(id: string, body: unknown, actorId?: string) {
    const existing = await workforceRepository.findEmployeeById(id)
    if (!existing) {
      throw new NotFoundError(EMPLOYEE_NOT_FOUND)
    }

    const data = parseUpdateBody(body)
    await assertReferencesExist(data.departmentId, data.jobRoleId)

    const updated = await workforceRepository.updateEmployee(id, {
      ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
      ...(data.departmentId !== undefined ? { departmentId: data.departmentId } : {}),
      ...(data.jobRoleId !== undefined ? { jobRoleId: data.jobRoleId } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      updatedBy: actorId,
    })

    return toEmployeeView(updated, evaluateRemainingCapacity(updated.allocations).remainingCapacity)
  },
}
