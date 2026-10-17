import React from 'react'
import { Link } from 'react-router'
import { Badge } from '../../../components/ui/badge.js'
import { Button } from '../../../components/ui/button.js'
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

function getInitials(name: string): string {
  if (!name) return 'EM'
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
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
      <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 p-8 shadow-inner shadow-black/20">
        <Spinner size="lg" />
        <p className="mt-3 text-sm font-medium text-slate-400">Memuat direktori karyawan...</p>
      </div>
    )
  }

  if (resources.length === 0) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/80 border border-slate-700/50 text-slate-400 shadow-md">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="mt-3 text-base font-semibold text-white">Tidak Ada Karyawan Ditemukan</h3>
        <p className="mt-1 max-w-sm text-sm text-slate-400">
          Tidak ada data karyawan yang cocok dengan kriteria pencarian atau filter yang dipilih.
        </p>
      </div>
    )
  }

  const totalPages = pagination.totalPages ?? Math.max(1, Math.ceil(pagination.total / pagination.pageSize))

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 shadow-xl shadow-black/30 backdrop-blur-sm">
      {/* Mobile scroll indicator */}
      <div className="flex sm:hidden items-center justify-between px-3.5 py-1.5 border-b border-slate-800/80 bg-slate-950/50 text-[11px] text-slate-400">
        <span>👉 Geser horizontal untuk melihat kolom lengkap</span>
        <span className="font-mono text-slate-500">{resources.length} baris</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm text-slate-300">
          <thead className="border-b border-slate-800 bg-slate-950/70 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <tr>
              <th scope="col" className="px-4 py-3.5">Kode</th>
              <th scope="col" className="px-4 py-3.5">Karyawan & Email</th>
              <th scope="col" className="px-4 py-3.5">Departemen</th>
              <th scope="col" className="px-4 py-3.5">Peran / Jabatan</th>
              <th scope="col" className="px-4 py-3.5">Status</th>
              <th scope="col" className="px-4 py-3.5">Ketersediaan</th>
              <th scope="col" className="px-4 py-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {resources.map((res) => {
              const hasCapacity =
                typeof res.currentRemainingCapacity === 'number' &&
                !Number.isNaN(res.currentRemainingCapacity) &&
                res.currentRemainingCapacity >= 0
              const remaining = res.currentRemainingCapacity

              return (
                <tr key={res.id} className="transition-colors hover:bg-slate-800/40">
                  <td className="px-4 py-3.5">
                    <span className="inline-block rounded-md bg-slate-800/90 border border-slate-700/60 px-2.5 py-1 font-mono text-xs font-semibold text-slate-200 shadow-inner">
                      {res.employeeCode}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600/30 via-slate-800 to-indigo-600/20 border border-blue-500/20 text-xs font-bold text-blue-300 shadow-sm">
                        {getInitials(res.fullName)}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{res.fullName}</div>
                        <div className="text-xs text-slate-400">{res.workEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-300 font-medium">
                    {res.departmentName ?? '—'}
                  </td>
                  <td className="px-4 py-3.5 text-slate-300">
                    {res.jobRoleTitle ?? '—'}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={res.status === 'ACTIVE' ? 'green' : 'gray'} className="gap-1.5">
                      <span
                        className={`inline-block h-1.5 w-1.5 rounded-full ${
                          res.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-slate-400'
                        }`}
                      />
                      {res.status === 'ACTIVE' ? 'Aktif' : 'Non-Aktif'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    {!hasCapacity || remaining === null || remaining === undefined ? (
                      <Badge variant="gray">Tidak Tersedia</Badge>
                    ) : (
                      <Badge
                        variant={remaining === 100 ? 'green' : remaining > 0 ? 'amber' : 'red'}
                        className="gap-1.5"
                      >
                        <span
                          className={`inline-block h-1.5 w-1.5 rounded-full ${
                            remaining === 100
                              ? 'bg-emerald-400'
                              : remaining > 0
                              ? 'bg-amber-400'
                              : 'bg-red-400'
                          }`}
                        />
                        {remaining}% Tersedia
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-2">
                    <Link to={`/resources/${res.id}`}>
                      <Button size="sm" variant="outline" className="hover:border-blue-500/50">
                        Detail
                      </Button>
                    </Link>
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onEdit(res)}
                      >
                        Edit
                      </Button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-800 bg-slate-950/40 px-4 py-3 sm:flex-row">
        <p className="text-xs text-slate-400">
          Menampilkan <span className="font-medium text-slate-200">{resources.length}</span> dari{' '}
          <span className="font-medium text-slate-200">{pagination.total}</span> karyawan
        </p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
          >
            Sebelumnya
          </Button>
          <span className="text-xs text-slate-300 px-2 font-medium">
            Halaman {pagination.page} dari {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={pagination.page >= totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
          >
            Berikutnya
          </Button>
        </div>
      </div>
    </div>
  )
}

