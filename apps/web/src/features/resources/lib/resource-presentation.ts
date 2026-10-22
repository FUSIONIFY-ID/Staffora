import type { Employee } from '../api/resources-api.js'

export type BadgeVariant = 'green' | 'amber' | 'red' | 'gray'

export interface AvailabilityPresentation {
  /** Short badge text, e.g. "100% available". */
  label: string
  variant: BadgeVariant
  /** Full sentence used as `title` and in the detail capacity card. */
  description: string
}

/**
 * Maps a resource's remaining capacity onto the three-state availability
 * indicator from PRD US02.01 - AC01.03:
 *   emerald -> 100% remaining (fully available)
 *   amber   -> 1-99% remaining (partially allocated)
 *   rose    -> 0% remaining (fully allocated)
 *
 * Inactive employees get a neutral badge instead, because capacity is
 * meaningless for a resource that cannot be staffed at all.
 *
 * `currentRemainingCapacity` comes from the backend capacity engine, which is
 * the single authority on how overlapping allocations combine (TSD 10.3). The
 * UI only classifies the number it is given and never recomputes workload.
 */
export function describeAvailability(employee: Employee): AvailabilityPresentation {
  if (employee.status !== 'ACTIVE') {
    return {
      label: 'Not assignable',
      variant: 'gray',
      description: 'Inactive employees cannot be allocated to projects.',
    }
  }

  const remaining = clampPercentage(employee.currentRemainingCapacity)

  if (remaining >= 100) {
    return {
      label: '100% available',
      variant: 'green',
      description: 'Fully available: no allocation is effective today.',
    }
  }

  if (remaining <= 0) {
    return {
      label: 'Fully allocated',
      variant: 'red',
      description: 'No remaining capacity: 100% of working time is allocated.',
    }
  }

  return {
    label: `${remaining}% available`,
    variant: 'amber',
    description: `Partially allocated: ${remaining}% of working time remains available.`,
  }
}

/** Clamps an API percentage into 0-100 and rounds it for display. */
export function clampPercentage(value: number | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value)))
}

const PROFICIENCY_LABELS: Readonly<Record<number, string>> = {
  1: 'Beginner',
  2: 'Elementary',
  3: 'Intermediate',
  4: 'Advanced',
  5: 'Expert',
}

/** Maps a 1-5 proficiency level onto the label required by US02.01 AC04.02. */
export function describeProficiency(level: number): string {
  return PROFICIENCY_LABELS[level] ?? 'Unknown'
}

export type AllocationDisplayStatus = 'PLANNED' | 'ACTIVE' | 'ENDED' | 'CANCELLED'

export interface AllocationStatusPresentation {
  label: string
  variant: BadgeVariant
}

/** Human labels for the allocation lifecycle states returned by the API. */
export function describeAllocationStatus(
  status: AllocationDisplayStatus | undefined,
): AllocationStatusPresentation {
  switch (status) {
    case 'ACTIVE':
      return { label: 'Active', variant: 'green' }
    case 'PLANNED':
      return { label: 'Planned', variant: 'amber' }
    case 'ENDED':
      return { label: 'Ended', variant: 'gray' }
    case 'CANCELLED':
      return { label: 'Cancelled', variant: 'red' }
    default:
      return { label: 'Unknown', variant: 'gray' }
  }
}

/** Initials for the avatar placeholder, e.g. "Budi Santoso" -> "BS". */
export function toInitials(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  const first = words[0] ?? ''
  const last = words.length > 1 ? (words[words.length - 1] ?? '') : ''
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
}

/** `YYYY-MM-DD` -> `12 Mar 2026`; returns the raw value when unparseable. */
export function formatDate(isoDate: string | undefined): string {
  if (!isoDate) return '—'
  const parsed = new Date(`${isoDate}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return isoDate
  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** Today's UTC calendar date as `YYYY-MM-DD`, matching the capacity engine. */
export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}
