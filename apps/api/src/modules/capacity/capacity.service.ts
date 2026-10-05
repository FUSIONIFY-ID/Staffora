import type {
  AllocationInterval,
  CapacityEvaluationResult,
  CapacityConflictDetail,
} from './capacity.types.js'

export function toDateString(date: Date | string): string {
  if (typeof date === 'string') {
    return date.slice(0, 10)
  }
  return date.toISOString().slice(0, 10)
}

export function addDays(dateStr: string, days: number): string {
  const parts = dateStr.split('-').map(Number)
  const y = parts[0] ?? 2026
  const m = parts[1] ?? 1
  const d = parts[2] ?? 1
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return dt.toISOString().slice(0, 10)
}

export function checkDateOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  return startA <= endB && endA >= startB
}

interface EventPoint {
  date: string
  delta: number
}

/**
 * Deterministic sweep-line algorithm for evaluating employee capacity
 * in accordance with Staffora TSD Section 10.
 */
export function evaluateCapacity(
  allocations: AllocationInterval[],
  requestedRange: { startDate: string; endDate: string },
  options?: {
    excludeAllocationId?: string
    requestedPercentage?: number
  },
): CapacityEvaluationResult {
  const reqStart = requestedRange.startDate
  const reqEnd = requestedRange.endDate
  const requestedPercentage = options?.requestedPercentage ?? 0

  // 1. Filter non-cancelled allocations intersecting requested range
  const relevantAllocations = allocations.filter((alloc) => {
    if (alloc.cancelledAt) return false
    if (options?.excludeAllocationId && alloc.id === options.excludeAllocationId) return false
    return checkDateOverlap(alloc.startDate, alloc.endDate, reqStart, reqEnd)
  })

  if (relevantAllocations.length === 0) {
    const hasConflict = requestedPercentage > 100
    return {
      peakAllocation: 0,
      remainingCapacity: 100,
      hasConflict,
      ...(hasConflict && {
        firstConflictRange: {
          startDate: reqStart,
          endDate: reqEnd,
          totalAllocation: requestedPercentage,
        },
      }),
    }
  }

  // 2. Build delta events for sweep-line algorithm
  const events: EventPoint[] = []

  for (const alloc of relevantAllocations) {
    const effectiveStart = alloc.startDate < reqStart ? reqStart : alloc.startDate
    const effectiveEnd = alloc.endDate > reqEnd ? reqEnd : alloc.endDate

    // Increment at effective start
    events.push({ date: effectiveStart, delta: alloc.allocationPercentage })

    // Decrement on the day AFTER effective end (since end date is inclusive)
    const dropDate = addDays(effectiveEnd, 1)
    events.push({ date: dropDate, delta: -alloc.allocationPercentage })
  }

  // Also anchor the query boundaries so we evaluate at least from reqStart to reqEnd
  events.push({ date: reqStart, delta: 0 })
  events.push({ date: addDays(reqEnd, 1), delta: 0 })

  // 3. Sort events: chronologically first.
  events.sort((a, b) => {
    const cmp = a.date.localeCompare(b.date)
    if (cmp !== 0) return cmp
    return a.delta - b.delta
  })

  // 4. Sweep through timeline
  let runningAllocation = 0
  let peakAllocation = 0
  let hasConflict = false
  let firstConflictRange: { startDate: string; endDate: string; totalAllocation: number } | undefined

  // Group events by date
  const dateMap = new Map<string, number>()
  for (const ev of events) {
    dateMap.set(ev.date, (dateMap.get(ev.date) ?? 0) + ev.delta)
  }

  const sortedDates = Array.from(dateMap.keys()).sort((a, b) => a.localeCompare(b))

  for (let i = 0; i < sortedDates.length; i++) {
    const date = sortedDates[i]!
    const delta = dateMap.get(date) ?? 0
    runningAllocation += delta

    // Only dates within [reqStart, reqEnd] count towards peak
    if (date >= reqStart && date <= reqEnd) {
      if (runningAllocation > peakAllocation) {
        peakAllocation = runningAllocation
      }

      const totalWithRequested = runningAllocation + requestedPercentage
      if (totalWithRequested > 100 && !hasConflict) {
        hasConflict = true
        const nextDate = sortedDates[i + 1]
        const conflictEnd = nextDate && nextDate <= reqEnd ? addDays(nextDate, -1) : reqEnd
        firstConflictRange = {
          startDate: date,
          endDate: conflictEnd < date ? date : conflictEnd,
          totalAllocation: totalWithRequested,
        }
      }
    }
  }

  const remainingCapacity = Math.max(0, 100 - peakAllocation)

  return {
    peakAllocation,
    remainingCapacity,
    hasConflict,
    firstConflictRange,
  }
}

/**
 * Formats a capacity conflict error structure as defined in TSD Section 10.5
 */
export function buildCapacityConflictDetail(
  evaluation: CapacityEvaluationResult,
  requestedPercentage: number,
  fallbackDates: { startDate: string; endDate: string },
): CapacityConflictDetail {
  return {
    peakAllocation: evaluation.peakAllocation,
    requestedAllocation: requestedPercentage,
    remainingCapacity: evaluation.remainingCapacity,
    conflictStartDate: evaluation.firstConflictRange?.startDate ?? fallbackDates.startDate,
    conflictEndDate: evaluation.firstConflictRange?.endDate ?? fallbackDates.endDate,
  }
}
