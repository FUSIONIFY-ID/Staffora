import React, { useState, useEffect } from 'react'
import { Button } from '../../../components/ui/button.js'
import type { DepartmentItem, JobRoleItem, ResourceFiltersState } from './types.js'

export interface ResourceFiltersProps {
  filters: ResourceFiltersState
  departments: DepartmentItem[]
  jobRoles: JobRoleItem[]
  onFilterChange: (updates: Partial<ResourceFiltersState>) => void
  onReset: () => void
}

export const ResourceFilters: React.FC<ResourceFiltersProps> = ({
  filters,
  departments,
  jobRoles,
  onFilterChange,
  onReset,
}): React.JSX.Element => {
  const [searchTerm, setSearchTerm] = useState(filters.search)

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== filters.search) {
        onFilterChange({ search: searchTerm, page: 1 })
      }
    }, 300)
    return () => clearTimeout(handler)
  }, [searchTerm, filters.search, onFilterChange])

  const handleResetClick = (): void => {
    setSearchTerm('')
    onReset()
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Search Input with 300ms debounce */}
        <div className="space-y-1.5 text-left">
          <label htmlFor="resource-search" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Cari Karyawan
          </label>
          <input
            id="resource-search"
            type="text"
            placeholder="Nama atau Kode (e.g. EMP001)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg bg-slate-900/80 border border-slate-700/80 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Department Filter */}
        <div className="space-y-1.5 text-left">
          <label htmlFor="resource-department-filter" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Departemen
          </label>
          <select
            id="resource-department-filter"
            value={filters.departmentId}
            onChange={(e) => onFilterChange({ departmentId: e.target.value, page: 1 })}
            className="w-full rounded-lg bg-slate-900/80 border border-slate-700/80 px-3.5 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Semua Departemen</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Job Role Filter */}
        <div className="space-y-1.5 text-left">
          <label htmlFor="resource-role-filter" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Peran / Jabatan
          </label>
          <select
            id="resource-role-filter"
            value={filters.jobRoleId}
            onChange={(e) => onFilterChange({ jobRoleId: e.target.value, page: 1 })}
            className="w-full rounded-lg bg-slate-900/80 border border-slate-700/80 px-3.5 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Semua Peran</option>
            {jobRoles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        {/* Employment Status Filter */}
        <div className="space-y-1.5 text-left">
          <label htmlFor="resource-status-filter" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Status Kerja
          </label>
          <select
            id="resource-status-filter"
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value as ResourceFiltersState['status'], page: 1 })}
            className="w-full rounded-lg bg-slate-900/80 border border-slate-700/80 px-3.5 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Non-Aktif</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <Button
          id="resource-reset-filter"
          type="button"
          variant="outline"
          size="sm"
          onClick={handleResetClick}
        >
          Reset Filter
        </Button>
      </div>
    </div>
  )
}
