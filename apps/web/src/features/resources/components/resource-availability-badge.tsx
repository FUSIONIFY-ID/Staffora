import React from 'react'
import { Badge } from '../../../components/ui/badge.js'
import type { Employee } from '../api/resources-api.js'
import { describeAvailability } from '../lib/resource-presentation.js'

export interface ResourceAvailabilityBadgeProps {
  employee: Employee
  className?: string
}

// Three-state indicator per PRD US02.01 AC01.03. Wording carries the state too,
// so colour is never the only signal.
export const ResourceAvailabilityBadge: React.FC<ResourceAvailabilityBadgeProps> = ({
  employee,
  className,
}) => {
  const availability = describeAvailability(employee)

  return (
    <Badge variant={availability.variant} className={className}>
      <span title={availability.description}>{availability.label}</span>
    </Badge>
  )
}
