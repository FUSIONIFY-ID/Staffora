import React from 'react'
import { Link } from 'react-router'
import { Spinner } from '../../../components/ui/spinner.js'
import type { ResourceItem, PaginationMetadata } from './types.js'

export interface ResourceTableProps {
  resources: ResourceItem[]
  isLoading: boolean
  pagination: PaginationMetadata
  canEdit: boolean
  onPageChange: (page: number) => void
  onEdit: (resource: ResourceItem) => void
}

export const ResourceTable: React.FC<ResourceTableProps> = ({
  resources,
  isLoading,
  pagination,
  canEdit,
  onPageChange,
  onEdit,
}): React.JSX.Element => {
  if (isLoading) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-xs">
        <Spinner size="lg" />
        <p className="mt-3 text-sm font-medium text-slate-500">Memuat direktori karyawan...</p>
      </div>
    )
  }

  if (resources.length === 0) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="mt-3 text-base font-semibold text-slate-900">Tidak Ada Karyawan Ditemukan</h3>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          Tidak ada data karyawan yang cocok dengan kriteria pencarian atau filter yang dipilih.
        </p>
      </div>
    )
  }

  const totalPages = pagination.totalPages ?? Math.max(1, Math.ceil(pagination.total / pagination.pageSize))

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm text-slate-600">
          <thead className="border-b border-slate-100 bg-white text-xs font-semibold text-slate-700">
            <tr>
              <th scope="col" className="px-6 py-4">Employee</th>
              <th scope="col" className="px-6 py-4">Code</th>
              <th scope="col" className="px-6 py-4">Role</th>
              <th scope="col" className="px-6 py-4">Department</th>
              <th scope="col" className="px-6 py-4">Allocation</th>
              <th scope="col" className="px-6 py-4">Availability</th>
              <th scope="col" className="px-6 py-4">Status</th>
              <th scope="col" className="px-6 py-4 text-right">
                <span className="sr-only">Aksi</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {resources.map((res) => {
              const hasCapacity =
                typeof res.currentRemainingCapacity === 'number' &&
                !Number.isNaN(res.currentRemainingCapacity) &&
                res.currentRemainingCapacity >= 0
              const remaining = res.currentRemainingCapacity
              const allocation = res.currentAllocation ?? (hasCapacity ? 100 - (remaining || 0) : 0)

              return (
                <tr key={res.id} className="group transition-colors hover:bg-slate-50/60">
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    <Link
                      to={`/resources/${res.id}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {res.fullName}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-sm">
                    {res.employeeCode}
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-sm">
                    {res.jobRoleTitle ?? 'Software Engineer'}
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-sm">
                    {res.departmentName ?? 'Engineering'}
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-sm">
                    {allocation}%
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-sm">
                    {hasCapacity ? (
                      <>
                        <span>{remaining}%</span>
                        <span className="sr-only">{remaining}% Tersedia</span>
                      </>
                    ) : (
                      <>
                        <span>—</span>
                        <span className="sr-only">Tidak Tersedia</span>
                      </>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-700 text-sm">
                    {res.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link to={`/resources/${res.id}`}>
                        <button
                          type="button"
                          className="text-xs text-slate-400 hover:text-blue-600 font-medium px-2 py-1 rounded transition-colors cursor-pointer"
                        >
                          Detail
                        </button>
                      </Link>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(res)}
                          className="text-xs text-slate-400 hover:text-slate-800 font-medium px-2 py-1 rounded transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 bg-white px-6 py-4 sm:flex-row">
        <p className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-900">{resources.length}</span> of{' '}
          <span className="font-semibold text-slate-900">{pagination.total}</span> employees
          <span className="sr-only">
            Menampilkan {resources.length} dari {pagination.total} karyawan
          </span>
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Sebelumnya
          </button>
          <span className="text-xs text-slate-500 px-2 font-medium">
            Halaman {pagination.page} dari {totalPages}
          </span>
          <button
            type="button"
            disabled={pagination.page >= totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Berikutnya
          </button>
        </div>
      </div>
    </div>
  )
}
