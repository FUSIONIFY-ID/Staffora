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

// Everything nests under the ['employees'] root so one invalidateQueries call
// refreshes both the list and any open detail view.
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

// keepPreviousData holds the current page on screen while the next one loads.
export function useEmployeeList(filters: EmployeeListFilters) {
  return useQuery<EmployeeListResult>({
    queryKey: resourceKeys.list(filters),
    queryFn: () => fetchEmployees(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}

export function useEmployeeDetail(employeeId: string | undefined, window?: CapacityWindow) {
  return useQuery<ResourceDetail>({
    queryKey: resourceKeys.detail(employeeId, window),
    queryFn: () => fetchEmployeeDetail(employeeId ?? '', window),
    enabled: Boolean(employeeId),
    staleTime: 30_000,
  })
}

export function useDepartments() {
  return useQuery({
    queryKey: resourceKeys.departments,
    queryFn: fetchDepartments,
    staleTime: 5 * 60_000,
  })
}

export function useJobRoles() {
  return useQuery({
    queryKey: resourceKeys.jobRoles,
    queryFn: fetchJobRoles,
    staleTime: 5 * 60_000,
  })
}

// Invalidates the whole root: a new employee changes the list, the total and
// therefore the pagination metadata.
export function useCreateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateEmployeeInput) => createEmployee(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: resourceKeys.all })
    },
  })
}

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
