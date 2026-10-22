import React from 'react'
import { Badge } from '../../../components/ui/badge.js'
import { Card } from '../../../components/ui/card.js'
import type { Allocation } from '../api/resources-api.js'
import {
  clampPercentage,
  describeAllocationStatus,
  formatDate,
} from '../lib/resource-presentation.js'

export interface ResourceAllocationsTableProps {
  allocations: Allocation[]
}

/**
 * Project allocations for a resource (PRD US02.01 - AC04.03).
 *
 * Columns: project, project role, date range, allocation percentage and status.
 * `displayStatus` is already derived server-side (PLANNED / ACTIVE / ENDED /
 * CANCELLED), so the table only maps it to a label and a colour and never tries
 * to infer the state from the dates itself.
 */
export const ResourceAllocationsTable: React.FC<ResourceAllocationsTableProps> = ({
  allocations,
}) => {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Project allocations</h2>
        <span className="text-xs text-slate-500">{allocations.length} total</span>
      </div>

      {allocations.length === 0 ? (
        <p className="text-sm text-slate-400">
          This resource is not allocated to any project in the selected period.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <caption className="sr-only">Project allocations for this resource</caption>
            <thead>
              <tr className="border-b border-slate-800 text-left">
                <th
                  scope="col"
                  className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400"
                >
                  Project
                </th>
                <th
                  scope="col"
                  className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400"
                >
                  Project role
                </th>
                <th
                  scope="col"
                  className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400"
                >
                  Period
                </th>
                <th
                  scope="col"
                  className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-400"
                >
                  Allocation
                </th>
                <th
                  scope="col"
                  className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400"
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {allocations.map((allocation) => {
                const status = describeAllocationStatus(allocation.displayStatus)
                const percentage = clampPercentage(allocation.allocationPercentage)

                return (
                  <tr key={allocation.id} className="border-b border-slate-800/60 last:border-0">
                    <td className="px-3 py-3">
                      <div className="font-medium text-slate-100">
                        {allocation.projectName ?? 'Unnamed project'}
                      </div>
                      {allocation.projectCode && (
                        <div className="font-mono text-xs text-slate-500">
                          {allocation.projectCode}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-slate-300">{allocation.jobRoleTitle ?? '—'}</td>
                    <td className="px-3 py-3 text-slate-400">
                      {formatDate(allocation.startDate)} – {formatDate(allocation.endDate)}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-slate-200">
                      {percentage}%
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={status.variant}>{status.label}</Badge>
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
