import React from 'react'
import { Badge } from '../../../components/ui/badge.js'
import { Card } from '../../../components/ui/card.js'
import type { ResourceDetail } from '../api/resources-api.js'
import { toInitials } from '../lib/resource-presentation.js'
import { ResourceAvailabilityBadge } from './resource-availability-badge.js'

export interface ResourceProfileHeaderProps {
  resource: ResourceDetail
}

interface FieldProps {
  label: string
  value: React.ReactNode
}

const Field: React.FC<FieldProps> = ({ label, value }) => (
  <div>
    <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</dt>
    <dd className="mt-1 text-sm text-slate-200">{value}</dd>
  </div>
)

export const ResourceProfileHeader: React.FC<ResourceProfileHeaderProps> = ({ resource }) => {
  return (
    <Card className="p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 text-xl font-bold text-blue-300"
          aria-hidden="true"
        >
          {toInitials(resource.fullName)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-white">{resource.fullName}</h1>
            <Badge variant={resource.status === 'ACTIVE' ? 'green' : 'gray'}>
              {resource.status === 'ACTIVE' ? 'Active' : 'Inactive'}
            </Badge>
            <ResourceAvailabilityBadge employee={resource} />
          </div>

          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Field label="Employee code" value={<span className="font-mono">{resource.employeeCode}</span>} />
            <Field label="Work email" value={resource.workEmail} />
            <Field label="Department" value={resource.departmentName ?? '-'} />
            <Field label="Job role" value={resource.jobRoleTitle ?? '-'} />
          </dl>
        </div>
      </div>
    </Card>
  )
}
