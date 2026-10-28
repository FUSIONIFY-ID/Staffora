import type { Employee } from '../api/resources-api.js'

export type BadgeVariant = 'green' | 'amber' | 'red' | 'gray'

export interface AvailabilityPresentation {
  label: string
  variant: BadgeVariant
  description: string
}

// Three-state indicator per PRD US02.01 AC01.03. Reads the capacity engine's
// figure and never recomputes workload from allocations.
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

export function describeProficiency(level: number): string {
  return PROFICIENCY_LABELS[level] ?? 'Unknown'
}

export type AllocationDisplayStatus = 'PLANNED' | 'ACTIVE' | 'ENDED' | 'CANCELLED'

export interface AllocationStatusPresentation {
  label: string
  variant: BadgeVariant
}

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

export function toInitials(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  const first = words[0] ?? ''
  const last = words.length > 1 ? (words[words.length - 1] ?? '') : ''
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
}

// Formats YYYY-MM-DD in UTC so the day never shifts with the local time zone.
export function formatDate(isoDate: string | undefined): string {
  if (!isoDate) return '-'
  const parsed = new Date(`${isoDate}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return isoDate
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}
