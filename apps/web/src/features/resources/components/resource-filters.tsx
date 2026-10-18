import React, { useState, useEffect } from 'react'
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
  canManage?: boolean
  onAddResource?: () => void
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
  canManage = false,
  onAddResource,
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

  const activeDept = departments.find((d) => d.id === filters.departmentId)
  const activeRole = jobRoles.find((r) => r.id === filters.jobRoleId)
  const hasActiveFilters = Boolean(
    filters.search || filters.departmentId || filters.jobRoleId || filters.status !== 'ALL',
  )

  const toggleStatus = (): void => {
    const nextStatus = filters.status === 'ALL' ? 'ACTIVE' : filters.status === 'ACTIVE' ? 'INACTIVE' : 'ALL'
    onFilterChange({ status: nextStatus, page: 1 })
  }

  return (
    <div className="space-y-3">
      {/* Top Filter & Actions Row matching Figma */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Search input + Filter pills */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
          {/* Search box with icon */}
          <div className="relative w-full sm:w-72 md:w-80">
            <label htmlFor="resource-search" className="sr-only">
              Cari Karyawan
            </label>
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              id="resource-search"
              type="text"
              placeholder="Search name or employee code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg bg-white border border-slate-200/90 pl-9 pr-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs transition-all"
            />
          </div>

          {/* Status Pill matching Figma (Active pill in green) */}
          <button
            type="button"
            onClick={toggleStatus}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer select-none ${
              filters.status === 'ACTIVE'
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                : filters.status === 'INACTIVE'
                ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {filters.status === 'ACTIVE' ? 'Active' : filters.status === 'INACTIVE' ? 'Inactive' : 'All Status'}
          </button>

          {/* Department Dropdown Pill */}
          <div className="relative inline-block">
            <select
              id="resource-department-filter"
              value={filters.departmentId}
              disabled={isDepartmentsLoading}
              onChange={(e) => onFilterChange({ departmentId: e.target.value, page: 1 })}
              className="rounded-full bg-slate-100 border border-transparent hover:border-slate-300 px-3.5 py-1.5 text-xs font-medium text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer transition-all"
            >
              <option value="">Department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
            {departmentsError && onRetryDepartments && (
              <button
                type="button"
                onClick={onRetryDepartments}
                className="ml-1 text-[11px] text-red-500 hover:underline"
              >
                Gagal. Coba lagi
              </button>
            )}
          </div>

          {/* Role Dropdown Pill */}
          <div className="relative inline-block">
            <select
              id="resource-role-filter"
              value={filters.jobRoleId}
              disabled={isJobRolesLoading}
              onChange={(e) => onFilterChange({ jobRoleId: e.target.value, page: 1 })}
              className="rounded-full bg-slate-100 border border-transparent hover:border-slate-300 px-3.5 py-1.5 text-xs font-medium text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer transition-all"
            >
              <option value="">Role</option>
              {jobRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            {jobRolesError && onRetryJobRoles && (
              <button
                type="button"
                onClick={onRetryJobRoles}
                className="ml-1 text-[11px] text-red-500 hover:underline"
              >
                Gagal. Coba lagi
              </button>
            )}
          </div>

          {/* Hidden helper select for status filter accessibility */}
          <select
            id="resource-status-filter"
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value as ResourceFiltersState['status'], page: 1 })}
            className="sr-only"
            aria-label="Filter Status"
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Non-Aktif</option>
          </select>
        </div>

        {/* Right side + Add Resource button matching Figma */}
        {canManage && onAddResource && (
          <button
            id="resource-create-button"
            type="button"
            onClick={onAddResource}
            aria-label="+ Tambah Karyawan"
            className="shrink-0 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-4 py-2 shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span className="sr-only">+ Tambah Karyawan</span>
            + Add Resource
          </button>
        )}
      </div>

      {/* Active Filter Chips Bar (collapsible) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
          <div className="flex flex-wrap items-center gap-1.5 text-slate-500">
            <span className="font-semibold text-slate-700">Filter Aktif:</span>
            {filters.search && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-blue-700 font-medium">
                Cari: &ldquo;{filters.search}&rdquo;
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('')
                    onFilterChange({ search: '', page: 1 })
                  }}
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
              setSearchTerm('')
              onReset()
            }}
            className="text-xs font-medium text-slate-500 hover:text-blue-600 cursor-pointer"
          >
            Reset Filter
          </button>
        </div>
      )}
    </div>
  )
}
