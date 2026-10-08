import React from 'react'
import { Badge, type BadgeProps } from '../ui/badge.js'
import type { components } from '../../api/schema.js'

type Schemas = components['schemas']

/** Every status enum published by the Staffora API contract. No frontend-only statuses. */
export type StatusValue =
  | Schemas['Project']['status']
  | Schemas['Employee']['status']
  | Schemas['StaffingRequirement']['status']
  | Schemas['Allocation']['displayStatus']
  | NonNullable<NonNullable<Schemas['OrganizationCapacityResponse']['data']>[number]['availabilityStatus']>

type BadgeVariant = NonNullable<BadgeProps['variant']>

const STATUS_DISPLAY: Record<StatusValue, { label: string; variant: BadgeVariant }> = {
  DRAFT: { label: 'Draft', variant: 'gray' },
  PLANNED: { label: 'Planned', variant: 'blue' },
  ACTIVE: { label: 'Active', variant: 'green' },
  COMPLETED: { label: 'Completed', variant: 'purple' },
  ARCHIVED: { label: 'Archived', variant: 'gray' },
  INACTIVE: { label: 'Inactive', variant: 'gray' },
  OPEN: { label: 'Open', variant: 'amber' },
  FULFILLED: { label: 'Fulfilled', variant: 'green' },
  ENDED: { label: 'Ended', variant: 'gray' },
  CANCELLED: { label: 'Cancelled', variant: 'red' },
  FULLY_AVAILABLE: { label: 'Fully Available', variant: 'green' },
  PARTIALLY_AVAILABLE: { label: 'Partially Available', variant: 'amber' },
  FULLY_ALLOCATED: { label: 'Fully Allocated', variant: 'red' },
}

export interface StatusBadgeProps {
  status: StatusValue
  /** Overrides the default label, e.g. for localized copy. */
  label?: string
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className }) => {
  const display = STATUS_DISPLAY[status]
  return (
    <Badge variant={display.variant} className={className}>
      <span className="sr-only">Status: </span>
      {label ?? display.label}
    </Badge>
  )
}
