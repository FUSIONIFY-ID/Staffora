import React from 'react'
import { Card } from '../../../components/ui/card.js'
import type { ResourceDetail } from '../api/resources-api.js'
import { clampPercentage } from '../lib/resource-presentation.js'

export interface ResourceCapacityCardProps {
  resource: ResourceDetail
}

export const ResourceCapacityCard: React.FC<ResourceCapacityCardProps> = ({ resource }) => {
  const evaluated = resource.evaluatedPeriod
  const peak = clampPercentage(evaluated?.peakConcurrentAllocation ?? resource.currentAllocation)
  const remaining = clampPercentage(
    evaluated?.remainingCapacity ?? resource.currentRemainingCapacity,
  )

  return (
    <Card className="p-6">
      <h2 className="text-base font-semibold text-ink">Current capacity</h2>

      <div className="mt-5 space-y-2">
        <div className="flex items-center gap-6">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${peak}%` }}
              role="progressbar"
              aria-valuenow={peak}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Allocated capacity"
            />
          </div>
          <span className="shrink-0 text-sm font-semibold text-success">
            {remaining}% remaining capacity
          </span>
        </div>

        <div>
          <span className="text-xs font-semibold text-primary">
            {peak}% allocated
          </span>
        </div>
      </div>
    </Card>
  )
}
