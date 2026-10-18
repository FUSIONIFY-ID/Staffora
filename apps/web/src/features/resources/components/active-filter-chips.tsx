import React from 'react'
import type { DepartmentItem, JobRoleItem, ResourceFiltersState } from './types.js'

export interface ActiveFilterChipsProps {
  filters: ResourceFiltersState
  departments: DepartmentItem[]
  jobRoles: JobRoleItem[]
  onFilterChange: (updates: Partial<ResourceFiltersState>) => void
  onReset: () => void
  onClearSearch: () => void
}

export const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({
  filters,
  departments,
  jobRoles,
  onFilterChange,
  onReset,
  onClearSearch,
}): React.JSX.Element | null => {
  const activeDept = departments.find((d) => d.id === filters.departmentId)
  const activeRole = jobRoles.find((r) => r.id === filters.jobRoleId)
  const hasActiveFilters = Boolean(
    filters.search || filters.departmentId || filters.jobRoleId || filters.status !== 'ALL',
  )

  if (!hasActiveFilters) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
      <div className="flex flex-wrap items-center gap-1.5 text-slate-500">
        <span className="font-semibold text-slate-700">Filter Aktif:</span>
        {filters.search && (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-blue-700 font-medium">
            Cari: &ldquo;{filters.search}&rdquo;
            <button
              type="button"
              onClick={onClearSearch}
              className="hover:text-blue-900 ml-0.5 font-bold cursor-pointer"
              aria-label="Hapus filter pencarian"
            >
              &times;
            </button>
          </span>
        )}
        {activeDept && (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-blue-700 font-medium">
            Dept: {activeDept.name}
            <button
              type="button"
              onClick={() => onFilterChange({ departmentId: '', page: 1 })}
              className="hover:text-blue-900 ml-0.5 font-bold cursor-pointer"
              aria-label="Hapus filter departemen"
            >
              &times;
            </button>
          </span>
        )}
        {activeRole && (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-blue-700 font-medium">
            Peran: {activeRole.name}
            <button
              type="button"
              onClick={() => onFilterChange({ jobRoleId: '', page: 1 })}
              className="hover:text-blue-900 ml-0.5 font-bold cursor-pointer"
              aria-label="Hapus filter peran"
            >
              &times;
            </button>
          </span>
        )}
        {filters.status !== 'ALL' && (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-blue-700 font-medium">
            Status: {filters.status === 'ACTIVE' ? 'Aktif' : 'Non-Aktif'}
            <button
              type="button"
              onClick={() => onFilterChange({ status: 'ALL', page: 1 })}
              className="hover:text-blue-900 ml-0.5 font-bold cursor-pointer"
              aria-label="Hapus filter status"
            >
              &times;
            </button>
          </span>
        )}
      </div>

      <button
        id="resource-reset-filter"
        type="button"
        onClick={() => {
          onClearSearch()
          onReset()
        }}
        className="text-xs font-medium text-slate-500 hover:text-blue-600 cursor-pointer"
      >
        Reset Filter
      </button>
    </div>
  )
}
