import React from 'react'
import { Card } from '../../../components/ui/card.js'
import type { ResourceDetail } from '../api/resources-api.js'
import { toInitials } from '../lib/resource-presentation.js'

export interface ResourceProfileHeaderProps {
  resource: ResourceDetail
}

export const ResourceProfileHeader: React.FC<ResourceProfileHeaderProps> = ({ resource }) => {
  return (
    <Card className="p-6">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full bg-info-surface text-xl font-bold text-primary"
        aria-hidden="true"
      >
        {toInitials(resource.fullName)}
      </div>

      <p className="mt-4 text-sm text-ink-muted">{resource.workEmail}</p>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-dim">Department</p>
          <p className="mt-1 text-sm font-semibold text-ink">{resource.departmentName ?? '-'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-dim">Employment</p>
          <div className="mt-1">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                resource.status === 'ACTIVE'
                  ? 'bg-success-surface text-success-text'
                  : 'bg-surface-chip text-ink-muted'
              }`}
            >
              {resource.status === 'ACTIVE' ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}
