import { describe, expect, it } from 'vitest'
import {
  clampPercentage,
  describeAllocationStatus,
  describeAvailability,
  describeProficiency,
  formatDate,
  toInitials,
} from '../src/features/resources/lib/resource-presentation.js'
import {
  ALL_EMPLOYEES,
  EMPLOYEE_AVAILABLE,
  EMPLOYEE_FULL,
  EMPLOYEE_PARTIAL,
} from './fixtures/resources-fixtures.js'

// Pinned as pure functions because one helper drives the badge, the header and
// the capacity card.
describe('resource presentation: availability indicator', () => {
  it('marks an unallocated employee as fully available in emerald', () => {
    const result = describeAvailability(EMPLOYEE_AVAILABLE)

    expect(result.variant).toBe('green')
    expect(result.label).toBe('100% available')
  })

  it('marks a partially allocated employee as amber with the remaining percentage', () => {
    const result = describeAvailability(EMPLOYEE_PARTIAL)

    expect(result.variant).toBe('amber')
    expect(result.label).toBe('45% available')
  })

  it('marks a fully allocated employee as rose', () => {
    const result = describeAvailability(EMPLOYEE_FULL)

    expect(result.variant).toBe('red')
    expect(result.label).toBe('Fully allocated')
  })

  it('treats the 1% and 99% boundaries as partially allocated', () => {
    expect(describeAvailability({ ...EMPLOYEE_AVAILABLE, currentRemainingCapacity: 99 }).variant).toBe(
      'amber',
    )
    expect(describeAvailability({ ...EMPLOYEE_AVAILABLE, currentRemainingCapacity: 1 }).variant).toBe(
      'amber',
    )
  })

  it('uses a neutral badge for inactive employees instead of a capacity colour', () => {
    const result = describeAvailability({ ...EMPLOYEE_PARTIAL, status: 'INACTIVE' })

    expect(result.variant).toBe('gray')
    expect(result.label).toBe('Not assignable')
  })

  it('clamps out-of-range or missing capacity values', () => {
    expect(clampPercentage(150)).toBe(100)
    expect(clampPercentage(-20)).toBe(0)
    expect(clampPercentage(undefined)).toBe(0)
    expect(clampPercentage(Number.NaN)).toBe(0)
    expect(clampPercentage(45.6)).toBe(46)
  })

  it('covers every employee fixture without producing an unexpected variant', () => {
    const variants = ALL_EMPLOYEES.map((employee) => describeAvailability(employee).variant)

    expect(variants).toEqual(['green', 'amber', 'red'])
  })
})

describe('resource presentation: proficiency and allocation labels', () => {
  it('maps proficiency levels 1-5 onto the required labels', () => {
    expect(describeProficiency(1)).toBe('Beginner')
    expect(describeProficiency(2)).toBe('Elementary')
    expect(describeProficiency(3)).toBe('Intermediate')
    expect(describeProficiency(4)).toBe('Advanced')
    expect(describeProficiency(5)).toBe('Expert')
  })

  it('falls back safely for an out-of-contract proficiency level', () => {
    expect(describeProficiency(9)).toBe('Unknown')
  })

  it('maps allocation display statuses to labels and badge variants', () => {
    expect(describeAllocationStatus('ACTIVE')).toEqual({ label: 'Active', variant: 'green' })
    expect(describeAllocationStatus('PLANNED')).toEqual({ label: 'Planned', variant: 'amber' })
    expect(describeAllocationStatus('ENDED')).toEqual({ label: 'Ended', variant: 'gray' })
    expect(describeAllocationStatus('CANCELLED')).toEqual({ label: 'Cancelled', variant: 'red' })
    expect(describeAllocationStatus(undefined).label).toBe('Unknown')
  })
})

describe('resource presentation: formatting', () => {
  it('derives initials from the first and last name', () => {
    expect(toInitials('Budi Santoso')).toBe('BS')
    expect(toInitials('Siti')).toBe('S')
    expect(toInitials('  Andi   Wijaya  ')).toBe('AW')
    expect(toInitials('')).toBe('?')
  })

  it('formats ISO dates without shifting the day across time zones', () => {
    expect(formatDate('2026-03-01')).toBe('Mar 01, 2026')
    expect(formatDate(undefined)).toBe('-')
    expect(formatDate('not-a-date')).toBe('not-a-date')
  })
})
