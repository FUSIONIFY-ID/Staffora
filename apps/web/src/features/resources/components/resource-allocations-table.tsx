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
    <Card className="border-slate-800 bg-slate-900/60 p-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white">Riwayat Alokasi Proyek</h2>
          <p className="text-xs text-slate-400 mt-0.5">Penugasan kerja pada proyek berjalan, terencana, dan selesai.</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">
          {allocations.length} Alokasi
        </span>
      </div>

      {allocations.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-400">
          Belum ada riwayat alokasi proyek untuk karyawan ini.
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/40 text-xs font-semibold uppercase tracking-wider text-slate-400">
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
                  badgeNode = <Badge variant="red">Dibatalkan</Badge>
                } else if (alloc.startDate <= today && alloc.endDate >= today) {
                  badgeNode = <Badge variant="green">Aktif Hari Ini</Badge>
                } else if (alloc.endDate < today) {
                  badgeNode = <Badge variant="gray">Selesai</Badge>
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
                      {alloc.allocationPercentage}%
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
      )}
    </Card>
  )
}
