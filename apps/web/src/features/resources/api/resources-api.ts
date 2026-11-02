import { ApiError, apiClient } from '../../../api/client.js'
import type { components } from '../../../api/schema.js'

// Contract types come from the generated schema, so the feature never keeps a
// hand-written copy of the API shape.
export type Employee = components['schemas']['Employee']
export type EmployeeDetail = components['schemas']['EmployeeDetail']
export type EmployeeSkill = components['schemas']['EmployeeSkill']
export type Allocation = components['schemas']['Allocation']
export type Department = components['schemas']['Department']
export type JobRole = components['schemas']['JobRole']
export type EmployeeStatus = Employee['status']
export type CreateEmployeeInput = components['schemas']['CreateEmployeeInput']
export type UpdateEmployeeInput = components['schemas']['UpdateEmployeeInput']

// Capacity figures for a date window, computed by the backend capacity engine.
export interface EvaluatedPeriod {
  startDate?: string
  endDate?: string
  peakConcurrentAllocation?: number
  remainingCapacity?: number
}

// Detail payload with `skills` and `allocations` normalised to arrays.
export type ResourceDetail = Employee & {
  skills: EmployeeSkill[]
  allocations: Allocation[]
  evaluatedPeriod?: EvaluatedPeriod
}

export interface EmployeeListMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface EmployeeListResult {
  data: Employee[]
  meta: EmployeeListMeta
}

export interface EmployeeListFilters {
  search: string
  departmentId: string
  jobRoleId: string
  status: '' | EmployeeStatus
  page: number
  pageSize: number
}

export interface CapacityWindow {
  startDate: string
  endDate: string
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue
    search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}

// GET /api/v1/employees. Pagination metadata comes from the response and is
// never recomputed from a partial page of rows.
export async function fetchEmployees(filters: EmployeeListFilters): Promise<EmployeeListResult> {
  const query = buildQuery({
    search: filters.search.trim() || undefined,
    departmentId: filters.departmentId || undefined,
    jobRoleId: filters.jobRoleId || undefined,
    status: filters.status || undefined,
    page: filters.page,
    pageSize: filters.pageSize,
  })

  const response = await apiClient<components['schemas']['EmployeeListResponse']>(
    `/employees${query}`,
  )

  const pageSize = response.meta?.pageSize ?? filters.pageSize
  const total = response.meta?.total ?? 0
  const totalPages =
    response.meta?.totalPages ?? (pageSize > 0 ? Math.ceil(total / pageSize) : 0)

  return {
    data: response.data ?? [],
    meta: {
      page: response.meta?.page ?? filters.page,
      pageSize,
      total,
      totalPages,
    },
  }
}

// GET /api/v1/employees/{id}. Omitting the window makes the backend evaluate
// today.
export async function fetchEmployeeDetail(
  employeeId: string,
  window?: CapacityWindow,
): Promise<ResourceDetail> {
  const query = buildQuery({
    startDate: window?.startDate,
    endDate: window?.endDate,
  })

  const response = await apiClient<{ data?: EmployeeDetail }>(
    `/employees/${encodeURIComponent(employeeId)}${query}`,
  )

  if (!response.data) {
    throw new ApiError(404, {
      message: 'Employee profile was not found.',
      code: 'NOT_FOUND',
    })
  }

  const detail = response.data

  return {
    ...detail,
    skills: detail.skills ?? [],
    allocations: detail.allocations ?? [],
    evaluatedPeriod: detail.evaluatedPeriod,
  }
}

export async function fetchDepartments(): Promise<Department[]> {
  const response = await apiClient<components['schemas']['DepartmentListResponse']>('/departments')
  return (response.data ?? []).filter((department) => department.isActive)
}

export async function fetchJobRoles(): Promise<JobRole[]> {
  const response = await apiClient<components['schemas']['JobRoleListResponse']>('/job-roles')
  return (response.data ?? []).filter((jobRole) => jobRole.isActive)
}

export async function createEmployee(input: CreateEmployeeInput): Promise<Employee> {
  const response = await apiClient<{ data?: Employee }>('/employees', {
    method: 'POST',
    body: JSON.stringify(input),
  })

  if (!response.data) {
    throw new ApiError(500, {
      message: 'The employee was created but the response could not be read.',
      code: 'INVALID_RESPONSE',
    })
  }

  return response.data
}

// PATCH /api/v1/employees/{id}. UpdateEmployeeInput only accepts fullName,
// departmentId, jobRoleId and status; code and work email are immutable.
export async function updateEmployee(
  employeeId: string,
  input: UpdateEmployeeInput,
): Promise<Employee> {
  const response = await apiClient<{ data?: Employee }>(
    `/employees/${encodeURIComponent(employeeId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  )

  if (!response.data) {
    throw new ApiError(500, {
      message: 'The employee was updated but the response could not be read.',
      code: 'INVALID_RESPONSE',
    })
  }

  return response.data
}
