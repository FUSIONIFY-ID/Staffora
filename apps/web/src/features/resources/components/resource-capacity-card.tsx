import React from 'react'
import { Badge } from '../../../components/ui/badge.js'
import { Card } from '../../../components/ui/card.js'
import type { ResourceDetail } from '../api/resources-api.js'
import {
  clampPercentage,
  describeAvailability,
  formatDate,
} from '../lib/resource-presentation.js'

export interface ResourceCapacityCardProps {
  resource: ResourceDetail
}

interface MetricProps {
  label: string
  value: string
  hint: string
}

const Metric: React.FC<MetricProps> = ({ label, value, hint }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
    <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    <p className="mt-1 text-xs text-slate-400">{hint}</p>
  </div>
)

/**
 * Capacity summary (PRD US02.01 - AC04.04).
 *
 * The numbers come straight from the backend capacity engine: `evaluatedPeriod`
 * for the requested window and `currentAllocation`/`currentRemainingCapacity`
 * as the today baseline. The card never sums allocation percentages itself —
 * overlapping allocations do not add linearly, which is exactly the bug the
 * shared capacity engine exists to prevent (TSD 10.3).
 */
export const ResourceCapacityCard: React.FC<ResourceCapacityCardProps> = ({ resource }) => {
  const availability = describeAvailability(resource)
  const evaluated = resource.evaluatedPeriod

  const peak = clampPercentage(evaluated?.peakConcurrentAllocation ?? resource.currentAllocation)
  const remaining = clampPercentage(
    evaluated?.remainingCapacity ?? resource.currentRemainingCapacity,
  )

  const windowLabel =
    evaluated?.startDate && evaluated.endDate
      ? `${formatDate(evaluated.startDate)} – ${formatDate(evaluated.endDate)}`
      : 'Today'

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-white">Capacity summary</h2>
        <Badge variant={availability.variant}>{availability.label}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Metric label="Peak allocation" value={`${peak}%`} hint="Highest concurrent workload" />
        <Metric label="Remaining capacity" value={`${remaining}%`} hint="Available to allocate" />
        <Metric label="Evaluated period" value={windowLabel} hint="Window used by the engine" />
      </div>

      <div className="mt-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full transition-all ${
              availability.variant === 'red'
                ? 'bg-rose-500'
                : availability.variant === 'amber'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
            }`}
            style={{ width: `${peak}%` }}
            role="progressbar"
            aria-valuenow={peak}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Peak concurrent allocation"
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">{availability.description}</p>
      </div>
    </Card>
  )
}
