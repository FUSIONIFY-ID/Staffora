import type { Prisma } from '../../generated/prisma/client.js'
import { NotFoundError, ValidationError } from '../../common/errors/app-error.js'
import type { AuthenticatedUser } from '../../common/auth/types.js'
import type {
  CreateDepartmentInput,
  CreateEmployeeInput,
  CreateJobRoleInput,
  EmployeeDetailQuery,
  EmployeeListQuery,
  UpdateEmployeeInput,
} from './workforce.schema.js'
import { workforceRepository } from './workforce.repository.js'
import { toDateString } from '../capacity/capacity.service.js'
import { toDetailView, toEmployeeView } from './workforce.views.js'
import { workforcePolicy } from './workforce.policy.js'
import {
  DEPARTMENT_NAME_DUPLICATE,
  DEPARTMENT_NAME_UNIQUE,
  EMPLOYEE_CODE_DUPLICATE,
  EMPLOYEE_DUPLICATE_FALLBACK,
  EMPLOYEE_UNIQUE,
  JOB_ROLE_NAME_DUPLICATE,
  JOB_ROLE_NAME_UNIQUE,
  WORK_EMAIL_DUPLICATE,
  conflictError,
  mapUniqueViolation,
} from './workforce.errors.js'
import type { EmployeeDetail, EmployeeSummaryRecord, EmployeeView } from './workforce.types.js'

const EMPLOYEE_NOT_FOUND = 'Employee profile was not found.'

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

  async createDepartment(
    data: CreateDepartmentInput,
    actorId?: string,
  ): Promise<{ id: string; name: string; isActive: boolean }> {
    // ERD 2.3: department names are unique on a normalised, case-insensitive
    // basis. The database index is what enforces it; this lookup only turns the
    // common sequential duplicate into a 409 without waiting for the constraint.
    if (await workforceRepository.findDepartmentByName(data.name)) {
      throw conflictError(DEPARTMENT_NAME_DUPLICATE)
    }

    try {
      return await workforceRepository.createDepartment(data.name, actorId)
    } catch (error) {
      return mapUniqueViolation(error, DEPARTMENT_NAME_UNIQUE, DEPARTMENT_NAME_DUPLICATE)
    }
  },

  async getJobRoles(): Promise<Array<{ id: string; name: string; isActive: boolean }>> {
    return workforceRepository.listJobRoles()
  },

  async createJobRole(
    data: CreateJobRoleInput,
    actorId?: string,
  ): Promise<{ id: string; name: string; isActive: boolean }> {
    if (await workforceRepository.findJobRoleByName(data.name)) {
      throw conflictError(JOB_ROLE_NAME_DUPLICATE)
    }

    try {
      return await workforceRepository.createJobRole(data.name, actorId)
    } catch (error) {
      return mapUniqueViolation(error, JOB_ROLE_NAME_UNIQUE, JOB_ROLE_NAME_DUPLICATE)
    }
  },

  async getEmployees(query: EmployeeListQuery): Promise<{
    data: EmployeeView[]
    total: number
    page: number
    pageSize: number
  }> {
    const { search, departmentId, jobRoleId, status, page, pageSize } = query

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

  async createEmployee(data: CreateEmployeeInput, actorId?: string): Promise<EmployeeView> {
    const workEmail = data.workEmail.toLowerCase()

    const [byCode, byEmail] = await Promise.all([
      workforceRepository.findEmployeeByCode(data.employeeCode),
      workforceRepository.findEmployeeByEmail(workEmail),
    ])

    if (byCode) {
      throw conflictError(EMPLOYEE_CODE_DUPLICATE)
    }
    if (byEmail) {
      throw conflictError(WORK_EMAIL_DUPLICATE)
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
      return mapUniqueViolation(error, EMPLOYEE_UNIQUE, EMPLOYEE_DUPLICATE_FALLBACK)
    }
  },

  async getEmployeeDetail(
    id: string,
    window: EmployeeDetailQuery,
    user: AuthenticatedUser,
  ): Promise<EmployeeDetail> {
    const employee = await workforceRepository.findEmployeeDetail(id)

    // A missing record and a record the caller may not see both answer 404, so
    // the response cannot be used to enumerate employee IDs.
    if (!employee) {
      throw new NotFoundError(EMPLOYEE_NOT_FOUND)
    }
    workforcePolicy.assertCanViewEmployee(user, employee.id)

    return toDetailView(employee, window, toDateString(new Date()))
  },

  async updateEmployee(
    id: string,
    data: UpdateEmployeeInput,
    actorId?: string,
  ): Promise<EmployeeView> {
    const existing = await workforceRepository.findEmployeeById(id)
    if (!existing) {
      throw new NotFoundError(EMPLOYEE_NOT_FOUND)
    }

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
