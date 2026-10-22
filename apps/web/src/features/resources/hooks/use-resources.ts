import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createEmployee,
  fetchDepartments,
  fetchEmployeeDetail,
  fetchEmployees,
  fetchJobRoles,
  updateEmployee,
  type CapacityWindow,
  type CreateEmployeeInput,
  type EmployeeListFilters,
  type EmployeeListResult,
  type ResourceDetail,
  type UpdateEmployeeInput,
} from '../api/resources-api.js'

/**
 * Query keys for the resources feature. Everything is nested under the
 * `['employees']` root so a single `invalidateQueries` call after a mutation
 * refreshes both the list and any open detail view.
 */
export const resourceKeys = {
  all: ['employees'] as const,
  lists: () => [...resourceKeys.all, 'list'] as const,
  list: (filters: EmployeeListFilters) => [...resourceKeys.lists(), filters] as const,
  details: () => [...resourceKeys.all, 'detail'] as const,
  detail: (employeeId: string | undefined, window?: CapacityWindow) =>
    [
      ...resourceKeys.details(),
      employeeId ?? null,
      window?.startDate ?? null,
      window?.endDate ?? null,
    ] as const,
  departments: ['departments'] as const,
  jobRoles: ['job-roles'] as const,
}

/**
 * Paginated employee list. `keepPreviousData` keeps the current page visible
 * while the next page loads, so paging and filtering do not flash an empty
 * table on every page change.
 */
export function useEmployeeList(filters: EmployeeListFilters) {
  return useQuery<EmployeeListResult>({
    queryKey: resourceKeys.list(filters),
    queryFn: () => fetchEmployees(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}

/** Employee profile with skills, allocations and the capacity evaluation. */
export function useEmployeeDetail(employeeId: string | undefined, window?: CapacityWindow) {
  return useQuery<ResourceDetail>({
    queryKey: resourceKeys.detail(employeeId, window),
    queryFn: () => fetchEmployeeDetail(employeeId ?? '', window),
    enabled: Boolean(employeeId),
    staleTime: 30_000,
  })
}

/** Department master data, cached for the session because it rarely changes. */
export function useDepartments() {
  return useQuery({
    queryKey: resourceKeys.departments,
    queryFn: fetchDepartments,
    staleTime: 5 * 60_000,
  })
}

/** Job role master data, cached for the session because it rarely changes. */
export function useJobRoles() {
  return useQuery({
    queryKey: resourceKeys.jobRoles,
    queryFn: fetchJobRoles,
    staleTime: 5 * 60_000,
  })
}

/**
 * Create mutation. Invalidating the whole `['employees']` root is intentional:
 * a new employee changes the list, the total count and therefore the pagination
 * controls, so a narrower invalidation would leave stale metadata behind.
 */
export function useCreateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateEmployeeInput) => createEmployee(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: resourceKeys.all })
    },
  })
}

/** Update mutation, invalidating the list and the affected detail record. */
export function useUpdateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ employeeId, input }: { employeeId: string; input: UpdateEmployeeInput }) =>
      updateEmployee(employeeId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: resourceKeys.all })
    },
  })
}
