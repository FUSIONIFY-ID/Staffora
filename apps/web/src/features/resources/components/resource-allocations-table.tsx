import React from 'react'
import { Card } from '../../../components/ui/card.js'
import { Badge } from '../../../components/ui/badge.js'
import type { ResourceAllocationItem } from './types.js'

export interface ResourceAllocationsTableProps {
  allocations: ResourceAllocationItem[]
}

export const ResourceAllocationsTable: React.FC<ResourceAllocationsTableProps> = ({
  allocations,
}): React.JSX.Element => {
  const today = new Date().toISOString().slice(0, 10)

  return (
    <Card className="border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/20 backdrop-blur-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white">Riwayat Alokasi Proyek</h2>
          <p className="text-xs text-slate-400 mt-0.5">Penugasan kerja pada proyek berjalan, terencana, dan selesai.</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700/50 shadow-sm">
          {allocations.length} Alokasi
        </span>
      </div>

      {allocations.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-400">
          Belum ada riwayat alokasi proyek untuk karyawan ini.
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
            <table className="w-full min-w-[560px] text-left text-sm text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-950/70 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th scope="col" className="px-4 py-3">Proyek</th>
                  <th scope="col" className="px-4 py-3">Peran Proyek</th>
                  <th scope="col" className="px-4 py-3">Rentang Waktu</th>
                  <th scope="col" className="px-4 py-3 text-center">Beban Kerja</th>
                  <th scope="col" className="px-4 py-3 text-right">Status Penugasan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {allocations.map((alloc) => {
                  let badgeNode = <Badge variant="blue">Terencana</Badge>
                  if (alloc.cancelledAt) {
                    badgeNode = (
                      <Badge variant="red" className="gap-1.5">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-400" />
                        Dibatalkan
                      </Badge>
                    )
                  } else if (alloc.startDate <= today && alloc.endDate >= today) {
                    badgeNode = (
                      <Badge variant="green" className="gap-1.5">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Aktif Hari Ini
                      </Badge>
                    )
                  } else if (alloc.endDate < today) {
                    badgeNode = (
                      <Badge variant="gray" className="gap-1.5">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400" />
                        Selesai
                      </Badge>
                    )
                  }

                  return (
                    <tr key={alloc.id} className="transition hover:bg-slate-800/30">
                      <td className="px-4 py-3.5 font-semibold text-white">
                        {alloc.projectName ?? 'Proyek Tanpa Judul'}
                      </td>
                      <td className="px-4 py-3.5 text-slate-300">
                        {alloc.jobRoleTitle ?? '—'}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-300">
                        {alloc.startDate} s/d {alloc.endDate}
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-white">
                        <span className="inline-block rounded-md bg-slate-800 px-2 py-0.5 text-xs text-blue-300 border border-slate-700">
                          {alloc.allocationPercentage}%
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {badgeNode}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-slate-800/80 bg-slate-950/30 px-3.5 py-2 text-xs text-slate-400">
            <svg className="h-4 w-4 shrink-0 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Riwayat penugasan proyek tetap diarsipkan dan dipertahankan dalam sistem untuk kebutuhan audit historis, termasuk ketika karyawan berstatus non-aktif.
            </span>
          </div>
        </div>
      )}
    </Card>
  )
}

