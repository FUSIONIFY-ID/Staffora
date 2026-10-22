import React, { useEffect, useState } from 'react'
import { Button } from '../../../components/ui/button.js'
import { useDebouncedValue } from '../hooks/use-debounced-value.js'
import type { Department, EmployeeListFilters, JobRole } from '../api/resources-api.js'

export interface ResourceFiltersProps {
  filters: EmployeeListFilters
  departments: Department[]
  jobRoles: JobRole[]
  isMasterDataLoading?: boolean
  onAddResource?: () => void
  onChange: (patch: Partial<EmployeeListFilters>) => void
  onReset: () => void
}

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
]

export const ResourceFilters: React.FC<ResourceFiltersProps> = ({
  filters,
  departments,
  jobRoles,
  isMasterDataLoading = false,
  onAddResource,
  onChange,
  onReset,
}) => {
  const [searchTerm, setSearchTerm] = useState(filters.search)
  const [appliedSearch, setAppliedSearch] = useState(filters.search)
  const debouncedSearch = useDebouncedValue(searchTerm, 300)

  if (filters.search !== appliedSearch) {
    setAppliedSearch(filters.search)
    setSearchTerm(filters.search)
  }

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

  return (
    <section aria-label="Resource filters" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-3">
        {/* Search input with search icon */}
        <div className="relative w-full sm:w-[320px]">
          <label htmlFor="resource-search" className="sr-only">
            Search
          </label>
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-placeholder"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            id="resource-search"
            type="search"
            placeholder="Search name or employee code..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="h-10 w-full rounded-lg border border-line-input bg-surface-white pl-10 pr-3.5 text-sm text-ink placeholder:text-ink-placeholder transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <label htmlFor="resource-filter-status" className="sr-only">
            Status
          </label>
          <select
            id="resource-filter-status"
            value={filters.status}
            onChange={(event) =>
              onChange({
                status: event.target.value === '' ? '' : (event.target.value as 'ACTIVE' | 'INACTIVE'),
                page: 1,
              })
            }
            className={`h-10 rounded-lg border text-xs font-semibold px-3 py-2 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 ${
              filters.status === 'ACTIVE'
                ? 'bg-success-surface text-success-text border-success-border'
                : 'bg-surface-white text-ink border-line-input'
            }`}
          >
            <option value="">Status</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Department filter */}
        <div className="relative">
          <label htmlFor="resource-filter-department" className="sr-only">
            Department
          </label>
          <select
            id="resource-filter-department"
            value={filters.departmentId}
            disabled={isMasterDataLoading}
            onChange={(event) => onChange({ departmentId: event.target.value, page: 1 })}
            className="h-10 rounded-lg border border-line-input bg-surface-white px-3 py-2 text-xs font-semibold text-ink cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          >
            <option value="">Department</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Job role filter */}
        <div className="relative">
          <label htmlFor="resource-filter-job-role" className="sr-only">
            Job role
          </label>
          <select
            id="resource-filter-job-role"
            value={filters.jobRoleId}
            disabled={isMasterDataLoading}
            onChange={(event) => onChange({ jobRoleId: event.target.value, page: 1 })}
            className="h-10 rounded-lg border border-line-input bg-surface-white px-3 py-2 text-xs font-semibold text-ink cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          >
            <option value="">Role</option>
            {jobRoles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

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

      {onAddResource && (
        <Button
          type="button"
          onClick={onAddResource}
          className="shrink-0 font-medium"
        >
          + Add Resource
        </Button>
      )}
    </section>
  )
}
