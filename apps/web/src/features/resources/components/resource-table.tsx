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
      <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40 p-8">
        <Spinner size="lg" />
        <p className="mt-3 text-sm text-slate-400">Memuat direktori karyawan...</p>
      </div>
    )
  }

  if (resources.length === 0) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-400">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <tr>
              <th scope="col" className="px-4 py-3.5">Kode</th>
              <th scope="col" className="px-4 py-3.5">Nama & Email</th>
              <th scope="col" className="px-4 py-3.5">Departemen</th>
              <th scope="col" className="px-4 py-3.5">Peran / Jabatan</th>
              <th scope="col" className="px-4 py-3.5">Status</th>
              <th scope="col" className="px-4 py-3.5">Ketersediaan</th>
              <th scope="col" className="px-4 py-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {resources.map((res) => {
              const remaining = res.currentRemainingCapacity ?? 100
              const availVariant = remaining === 100 ? 'green' : remaining > 0 ? 'amber' : 'red'

              return (
                <tr key={res.id} className="transition hover:bg-slate-800/40">
                  <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-200">
                    {res.employeeCode}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-white">{res.fullName}</div>
                    <div className="text-xs text-slate-400">{res.workEmail}</div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-300">
                    {res.departmentName ?? '—'}
                  </td>
                  <td className="px-4 py-3.5 text-slate-300">
                    {res.jobRoleTitle ?? '—'}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={res.status === 'ACTIVE' ? 'green' : 'gray'}>
                      {res.status === 'ACTIVE' ? 'Aktif' : 'Non-Aktif'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={availVariant}>
                      {remaining}% Tersedia
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-2">
                    <Link to={`/resources/${res.id}`}>
                      <Button size="sm" variant="outline">
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
      <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-800 px-4 py-3 sm:flex-row">
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
          <span className="text-xs text-slate-300 px-2">
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
