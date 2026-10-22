import React from 'react'
import { Badge } from '../../../components/ui/badge.js'
import type { Employee } from '../api/resources-api.js'
import { describeAvailability } from '../lib/resource-presentation.js'

export interface ResourceAvailabilityBadgeProps {
  employee: Employee
  className?: string
}

/**
 * Three-state availability indicator (PRD US02.01 - AC01.03).
 *
 * The wording carries the state as well as the colour, so the badge is still
 * readable without colour vision or a screen reader announcing classes.
 */
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
