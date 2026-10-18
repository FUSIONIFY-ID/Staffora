import React from 'react'
import type { ResourceAllocationItem } from './types.js'

export interface ResourceAllocationsTableProps {
  allocations: ResourceAllocationItem[]
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const year = parts[0]
    const month = months[parseInt(parts[1], 10) - 1] || parts[1]
    const day = parts[2]
    return `${month} ${day}, ${year}`
  }
  return dateStr
}

function getStatusBadge(alloc: ResourceAllocationItem, todayStr: string): { text: string; className: string } {
  if (alloc.cancelledAt) {
    return { text: 'Dibatalkan', className: 'text-red-600' }
  }
  if (alloc.endDate < todayStr) {
    return { text: 'Selesai', className: 'text-slate-400' }
  }
  if (alloc.startDate > todayStr) {
    return { text: 'Terencana', className: 'text-blue-600' }
  }
  return { text: 'Active', className: 'text-slate-700 font-normal' }
}

export const ResourceAllocationsTable: React.FC<ResourceAllocationsTableProps> = ({
  allocations,
}): React.JSX.Element => {
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
      {allocations.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-400">
          Belum ada riwayat alokasi proyek untuk karyawan ini.
        </div>
      ) : (
        <div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm text-slate-700">
              <thead className="border-b border-slate-100 bg-white text-xs font-semibold text-slate-700">
                <tr>
                  <th scope="col" className="px-6 py-4">Project</th>
                  <th scope="col" className="px-6 py-4">Project Role</th>
                  <th scope="col" className="px-6 py-4">Allocation</th>
                  <th scope="col" className="px-6 py-4">Start</th>
                  <th scope="col" className="px-6 py-4">End</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allocations.map((alloc) => {
                  const status = getStatusBadge(alloc, today)

                  return (
                    <tr key={alloc.id} className="transition-colors hover:bg-slate-50/60">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {alloc.projectName ?? 'Project Alpha'}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {alloc.jobRoleTitle ?? 'Software Engineer'}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {alloc.allocationPercentage}%
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-sm">
                        {formatDate(alloc.startDate)}
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-sm">
                        {formatDate(alloc.endDate)}
                      </td>
                      <td className={`px-6 py-4 text-sm ${status.className}`}>
                        {status.text}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/30 px-6 py-3 text-xs text-slate-400">
            <svg className="h-4 w-4 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Riwayat penugasan proyek tetap diarsipkan dan dipertahankan dalam sistem untuk kebutuhan audit historis, termasuk ketika karyawan berstatus non-aktif.
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
