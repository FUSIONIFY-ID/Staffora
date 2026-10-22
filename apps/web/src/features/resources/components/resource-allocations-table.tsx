import React from 'react'
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

export const ResourceAllocationsTable: React.FC<ResourceAllocationsTableProps> = ({
  allocations,
}) => {
  if (allocations.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-sm text-ink-muted">
          This resource is not allocated to any project in the selected period.
        </p>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">Project allocations for this resource</caption>
          <thead>
            <tr className="h-[46px] border-b border-line bg-surface-table-header text-left">
              <th scope="col" className="px-6 py-3 text-xs font-semibold text-ink-muted">
                Project
              </th>
              <th scope="col" className="px-6 py-3 text-xs font-semibold text-ink-muted">
                Project Role
              </th>
              <th scope="col" className="px-6 py-3 text-xs font-semibold text-ink-muted">
                Allocation
              </th>
              <th scope="col" className="px-6 py-3 text-xs font-semibold text-ink-muted">
                Start
              </th>
              <th scope="col" className="px-6 py-3 text-xs font-semibold text-ink-muted">
                End
              </th>
              <th scope="col" className="px-6 py-3 text-xs font-semibold text-ink-muted">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-divider">
            {allocations.map((allocation) => {
              const status = describeAllocationStatus(allocation.displayStatus)
              const percentage = clampPercentage(allocation.allocationPercentage)

              return (
                <tr
                  key={allocation.id}
                  className="h-[48px] transition-colors hover:bg-surface-page/50"
                >
                  <td className="px-6 py-3.5 font-semibold text-ink">
                    {allocation.projectName ?? 'Unnamed project'}
                  </td>
                  <td className="px-6 py-3.5 text-ink-muted">{allocation.jobRoleTitle ?? '-'}</td>
                  <td className="px-6 py-3.5 text-ink-muted">{percentage}%</td>
                  <td className="px-6 py-3.5 text-ink-muted">{formatDate(allocation.startDate)}</td>
                  <td className="px-6 py-3.5 text-ink-muted">{formatDate(allocation.endDate)}</td>
                  <td className="px-6 py-3.5 text-ink-muted">{status.label}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
