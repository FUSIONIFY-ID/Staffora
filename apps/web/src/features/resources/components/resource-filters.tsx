import React, { useEffect, useState } from 'react'
import { Button } from '../../../components/ui/button.js'
import { Input } from '../../../components/ui/input.js'
import { Select } from '../../../components/ui/select.js'
import { useDebouncedValue } from '../hooks/use-debounced-value.js'
import type { Department, EmployeeListFilters, JobRole } from '../api/resources-api.js'

export interface ResourceFiltersProps {
  filters: EmployeeListFilters
  departments: Department[]
  jobRoles: JobRole[]
  isMasterDataLoading?: boolean
  onChange: (patch: Partial<EmployeeListFilters>) => void
  onReset: () => void
}

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active only' },
  { value: 'INACTIVE', label: 'Inactive only' },
]

// The search box keeps its own state so the caret never lags, and only pushes
// the value up after 300ms of no typing. Other controls change immediately.
export const ResourceFilters: React.FC<ResourceFiltersProps> = ({
  filters,
  departments,
  jobRoles,
  isMasterDataLoading = false,
  onChange,
  onReset,
}) => {
  const [searchTerm, setSearchTerm] = useState(filters.search)
  const [appliedSearch, setAppliedSearch] = useState(filters.search)
  const debouncedSearch = useDebouncedValue(searchTerm, 300)

  // Adjust state during render (not in an effect) so a parent reset applies in
  // the same pass instead of causing a cascading render.
  if (filters.search !== appliedSearch) {
    setAppliedSearch(filters.search)
    setSearchTerm(filters.search)
  }

  // Push the debounced value up only when it actually differs from the applied
  // filter, so re-renders caused by other filters cannot re-trigger a fetch.
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onChange({ search: debouncedSearch, page: 1 })
    }
  }, [debouncedSearch, filters.search, onChange])

  const hasActiveFilters =
    filters.search !== '' ||
    filters.departmentId !== '' ||
    filters.jobRoleId !== '' ||
    filters.status !== ''

  const departmentOptions = departments.map((department) => ({
    value: department.id,
    label: department.name,
  }))

  const jobRoleOptions = jobRoles.map((jobRole) => ({
    value: jobRole.id,
    label: jobRole.name,
  }))

  return (
    <section aria-label="Resource filters" className="glass-card p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Input
          id="resource-search"
          label="Search"
          type="search"
          placeholder="Name, employee code or email"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          helperText="Searches name, employee code and email."
        />

        <Select
          id="resource-filter-department"
          label="Department"
          placeholder="All departments"
          options={departmentOptions}
          value={filters.departmentId}
          disabled={isMasterDataLoading}
          onChange={(event) => onChange({ departmentId: event.target.value, page: 1 })}
        />

        <Select
          id="resource-filter-job-role"
          label="Job role"
          placeholder="All job roles"
          options={jobRoleOptions}
          value={filters.jobRoleId}
          disabled={isMasterDataLoading}
          onChange={(event) => onChange({ jobRoleId: event.target.value, page: 1 })}
        />

        <Select
          id="resource-filter-status"
          label="Status"
          placeholder="All statuses"
          options={STATUS_OPTIONS}
          value={filters.status}
          onChange={(event) =>
            onChange({
              status: event.target.value === '' ? '' : (event.target.value as 'ACTIVE' | 'INACTIVE'),
              page: 1,
            })
          }
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-800 pt-3">
        <p className="text-xs text-slate-500">
          {hasActiveFilters
            ? 'Filters are applied to the server query.'
            : 'Showing every resource in the directory.'}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onReset}
          disabled={!hasActiveFilters}
        >
          Reset filters
        </Button>
      </div>
    </section>
  )
}
