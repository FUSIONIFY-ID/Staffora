import React, { useState, useEffect } from 'react'
import { Button } from '../../../components/ui/button.js'
import type { DepartmentItem, JobRoleItem, ResourceFiltersState } from './types.js'

export interface ResourceFiltersProps {
  filters: ResourceFiltersState
  departments: DepartmentItem[]
  jobRoles: JobRoleItem[]
  isDepartmentsLoading?: boolean
  departmentsError?: Error | null
  onRetryDepartments?: () => void
  isJobRolesLoading?: boolean
  jobRolesError?: Error | null
  onRetryJobRoles?: () => void
  onFilterChange: (updates: Partial<ResourceFiltersState>) => void
  onReset: () => void
}

export const ResourceFilters: React.FC<ResourceFiltersProps> = ({
  filters,
  departments,
  jobRoles,
  isDepartmentsLoading = false,
  departmentsError = null,
  onRetryDepartments,
  isJobRolesLoading = false,
  jobRolesError = null,
  onRetryJobRoles,
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

  const [prevSearchProp, setPrevSearchProp] = useState(filters.search)
  if (filters.search !== prevSearchProp) {
    setPrevSearchProp(filters.search)
    setSearchTerm(filters.search)
  }

  const handleResetClick = (): void => {
    setSearchTerm('')
    onReset()
  }

  const activeDept = departments.find((d) => d.id === filters.departmentId)
  const activeRole = jobRoles.find((r) => r.id === filters.jobRoleId)
  const hasActiveFilters = Boolean(
    filters.search || filters.departmentId || filters.jobRoleId || filters.status !== 'ALL',
  )

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-4 shadow-xl shadow-black/20 backdrop-blur-sm">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Search Input with 300ms debounce and search icon */}
        <div className="space-y-1.5 text-left">
          <label htmlFor="resource-search" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Cari Karyawan
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              id="resource-search"
              type="text"
              placeholder="Nama atau Kode (e.g. EMP001)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg bg-slate-900/80 border border-slate-700/80 pl-9 pr-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Department Filter */}
        <div className="space-y-1.5 text-left">
          <div className="flex items-center justify-between">
            <label htmlFor="resource-department-filter" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Departemen
            </label>
            {departmentsError && onRetryDepartments && (
              <button
                type="button"
                onClick={onRetryDepartments}
                className="text-[11px] text-red-400 hover:underline cursor-pointer"
              >
                Gagal. Coba lagi
              </button>
            )}
          </div>
          <select
            id="resource-department-filter"
            value={filters.departmentId}
            disabled={isDepartmentsLoading}
            onChange={(e) => onFilterChange({ departmentId: e.target.value, page: 1 })}
            className="w-full rounded-lg bg-slate-900/80 border border-slate-700/80 px-3.5 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
          >
            <option value="">
              {isDepartmentsLoading ? 'Memuat departemen...' : 'Semua Departemen'}
            </option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Job Role Filter */}
        <div className="space-y-1.5 text-left">
          <div className="flex items-center justify-between">
            <label htmlFor="resource-role-filter" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Peran / Jabatan
            </label>
            {jobRolesError && onRetryJobRoles && (
              <button
                type="button"
                onClick={onRetryJobRoles}
                className="text-[11px] text-red-400 hover:underline cursor-pointer"
              >
                Gagal. Coba lagi
              </button>
            )}
          </div>
          <select
            id="resource-role-filter"
            value={filters.jobRoleId}
            disabled={isJobRolesLoading}
            onChange={(e) => onFilterChange({ jobRoleId: e.target.value, page: 1 })}
            className="w-full rounded-lg bg-slate-900/80 border border-slate-700/80 px-3.5 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
          >
            <option value="">
              {isJobRolesLoading ? 'Memuat peran...' : 'Semua Peran'}
            </option>
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

      {/* Active Filter Chips and Reset Action */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
          <span className="font-medium text-slate-400">Filter Aktif:</span>
          {!hasActiveFilters ? (
            <span className="text-slate-400 italic">Tidak ada filter diterapkan</span>
          ) : (
            <>
              {filters.search && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 text-blue-300">
                  Cari: &ldquo;{filters.search}&rdquo;
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('')
                      onFilterChange({ search: '', page: 1 })
                    }}
                    className="hover:text-white"
                    aria-label="Hapus filter pencarian"
                  >
                    &times;
                  </button>
                </span>
              )}
              {activeDept && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 text-blue-300">
                  Dept: {activeDept.name}
                  <button
                    type="button"
                    onClick={() => onFilterChange({ departmentId: '', page: 1 })}
                    className="hover:text-white"
                    aria-label="Hapus filter departemen"
                  >
                    &times;
                  </button>
                </span>
              )}
              {activeRole && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 text-blue-300">
                  Peran: {activeRole.name}
                  <button
                    type="button"
                    onClick={() => onFilterChange({ jobRoleId: '', page: 1 })}
                    className="hover:text-white"
                    aria-label="Hapus filter peran"
                  >
                    &times;
                  </button>
                </span>
              )}
              {filters.status !== 'ALL' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 text-blue-300">
                  Status: {filters.status === 'ACTIVE' ? 'Aktif' : 'Non-Aktif'}
                  <button
                    type="button"
                    onClick={() => onFilterChange({ status: 'ALL', page: 1 })}
                    className="hover:text-white"
                    aria-label="Hapus filter status"
                  >
                    &times;
                  </button>
                </span>
              )}
            </>
          )}
        </div>

        <Button
          id="resource-reset-filter"
          type="button"
          variant="outline"
          size="sm"
          onClick={handleResetClick}
          disabled={!hasActiveFilters}
          className="hover:border-slate-600"
        >
          Reset Filter
        </Button>
      </div>
    </div>
  )
}

