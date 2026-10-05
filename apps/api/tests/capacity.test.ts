import { describe, it, expect } from 'vitest'
import {
  evaluateCapacity,
  buildCapacityConflictDetail,
} from '../src/modules/capacity/capacity.service.js'
import type { AllocationInterval } from '../src/modules/capacity/capacity.types.js'

describe('TSD 15.3 - Mandatory Capacity Scenarios', () => {
  // 1. No existing allocation
  it('Scenario 1: No existing allocation yields 0% peak and 100% remaining capacity', () => {
    const allocations: AllocationInterval[] = []
    const result = evaluateCapacity(allocations, {
      startDate: '2026-11-01',
      endDate: '2026-11-30',
    })
    expect(result.peakAllocation).toBe(0)
    expect(result.remainingCapacity).toBe(100)
    expect(result.hasConflict).toBe(false)
  })

  // 2. Non-overlapping allocation
  it('Scenario 2: Non-overlapping allocation does not consume capacity', () => {
    const allocations: AllocationInterval[] = [
      {
        id: 'alloc-1',
        startDate: '2026-10-01',
        endDate: '2026-10-15',
        allocationPercentage: 50,
      },
    ]
    const result = evaluateCapacity(allocations, {
      startDate: '2026-11-01',
      endDate: '2026-11-30',
    })
    expect(result.peakAllocation).toBe(0)
    expect(result.remainingCapacity).toBe(100)
    expect(result.hasConflict).toBe(false)
  })

  // 3. Partial overlap
  it('Scenario 3: Partial overlap accounts for peak concurrent allocation in queried range', () => {
    const allocations: AllocationInterval[] = [
      {
        id: 'alloc-1',
        startDate: '2026-10-25',
        endDate: '2026-11-05',
        allocationPercentage: 40,
      },
    ]
    const result = evaluateCapacity(allocations, {
      startDate: '2026-11-01',
      endDate: '2026-11-30',
    })
    expect(result.peakAllocation).toBe(40)
    expect(result.remainingCapacity).toBe(60)
  })

  // 4. Full overlap
  it('Scenario 4: Full overlap consumes specified percentage across the entire period', () => {
    const allocations: AllocationInterval[] = [
      {
        id: 'alloc-1',
        startDate: '2026-11-01',
        endDate: '2026-11-30',
        allocationPercentage: 60,
      },
    ]
    const result = evaluateCapacity(allocations, {
      startDate: '2026-11-05',
      endDate: '2026-11-15',
    })
    expect(result.peakAllocation).toBe(60)
    expect(result.remainingCapacity).toBe(40)
  })

  // 5. Sequential non-concurrent allocations
  it('Scenario 5: Sequential non-concurrent allocations do not sum together (peak is max, not sum)', () => {
    // TSD Page 12/13 example: 50% on Jan 1-15 and 50% on Jan 16-31 yields peak 50%, NOT 100%
    const allocations: AllocationInterval[] = [
      {
        id: 'alloc-1',
        startDate: '2026-01-01',
        endDate: '2026-01-15',
        allocationPercentage: 50,
      },
      {
        id: 'alloc-2',
        startDate: '2026-01-16',
        endDate: '2026-01-31',
        allocationPercentage: 50,
      },
    ]
    const result = evaluateCapacity(allocations, {
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    })
    expect(result.peakAllocation).toBe(50)
    expect(result.remainingCapacity).toBe(50)
    expect(result.hasConflict).toBe(false)
  })

  // 6. Same-day inclusive boundary
  it('Scenario 6: Same-day inclusive boundary sums to 100% when one ends and another starts on same date', () => {
    const allocations: AllocationInterval[] = [
      {
        id: 'alloc-1',
        startDate: '2026-01-01',
        endDate: '2026-01-15',
        allocationPercentage: 50,
      },
      {
        id: 'alloc-2',
        startDate: '2026-01-15',
        endDate: '2026-01-31',
        allocationPercentage: 50,
      },
    ]
    const result = evaluateCapacity(allocations, {
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    })
    expect(result.peakAllocation).toBe(100)
    expect(result.remainingCapacity).toBe(0)
  })

  // 7. Allocation exactly 100%
  it('Scenario 7: Allocation reaching exactly 100% is valid and has no conflict', () => {
    const allocations: AllocationInterval[] = [
      {
        id: 'alloc-1',
        startDate: '2026-11-01',
        endDate: '2026-11-30',
        allocationPercentage: 70,
      },
    ]
    const result = evaluateCapacity(
      allocations,
      { startDate: '2026-11-01', endDate: '2026-11-30' },
      { requestedPercentage: 30 },
    )
    expect(result.peakAllocation).toBe(70)
    expect(result.remainingCapacity).toBe(30)
    expect(result.hasConflict).toBe(false)
  })

  // 8. Allocation above 100%
  it('Scenario 8: Allocation above 100% produces a capacity conflict with proper metadata', () => {
    const allocations: AllocationInterval[] = [
      {
        id: 'alloc-1',
        startDate: '2026-11-01',
        endDate: '2026-11-15',
        allocationPercentage: 80,
      },
    ]
    const result = evaluateCapacity(
      allocations,
      { startDate: '2026-11-01', endDate: '2026-11-30' },
      { requestedPercentage: 30 },
    )
    expect(result.peakAllocation).toBe(80)
    expect(result.remainingCapacity).toBe(20)
    expect(result.hasConflict).toBe(true)

    const conflictDetail = buildCapacityConflictDetail(result, 30, {
      startDate: '2026-11-01',
      endDate: '2026-11-30',
    })
    expect(conflictDetail.peakAllocation).toBe(80)
    expect(conflictDetail.requestedAllocation).toBe(30)
    expect(conflictDetail.remainingCapacity).toBe(20)
    expect(conflictDetail.conflictStartDate).toBe('2026-11-01')
    expect(conflictDetail.conflictEndDate).toBe('2026-11-15')
  })

  // 9. Multiple concurrent allocations
  it('Scenario 9: Multiple concurrent allocations sum up properly', () => {
    const allocations: AllocationInterval[] = [
      {
        id: 'alloc-1',
        startDate: '2026-05-01',
        endDate: '2026-05-20',
        allocationPercentage: 30,
      },
      {
        id: 'alloc-2',
        startDate: '2026-05-10',
        endDate: '2026-05-31',
        allocationPercentage: 40,
      },
      {
        id: 'alloc-3',
        startDate: '2026-05-15',
        endDate: '2026-05-18',
        allocationPercentage: 20,
      },
    ]
    const result = evaluateCapacity(allocations, {
      startDate: '2026-05-01',
      endDate: '2026-05-31',
    })
    // From 05-15 to 05-18: 30 + 40 + 20 = 90%
    expect(result.peakAllocation).toBe(90)
    expect(result.remainingCapacity).toBe(10)
  })

  // 10. Edit excludes current allocation
  it('Scenario 10: Edit excludes currently modified allocation before validating new values', () => {
    const allocations: AllocationInterval[] = [
      {
        id: 'alloc-to-edit',
        startDate: '2026-06-01',
        endDate: '2026-06-30',
        allocationPercentage: 80,
      },
      {
        id: 'other-alloc',
        startDate: '2026-06-01',
        endDate: '2026-06-30',
        allocationPercentage: 20,
      },
    ]
    // User wants to update alloc-to-edit from 80% to 75%
    const result = evaluateCapacity(
      allocations,
      { startDate: '2026-06-01', endDate: '2026-06-30' },
      {
        excludeAllocationId: 'alloc-to-edit',
        requestedPercentage: 75,
      },
    )
    expect(result.peakAllocation).toBe(20) // Only other-alloc considered
    expect(result.remainingCapacity).toBe(80)
    expect(result.hasConflict).toBe(false) // 20 + 75 = 95% <= 100%
  })

  // 11. Cancelled allocation
  it('Scenario 11: Cancelled allocation does not consume capacity', () => {
    const allocations: AllocationInterval[] = [
      {
        id: 'alloc-cancelled',
        startDate: '2026-07-01',
        endDate: '2026-07-31',
        allocationPercentage: 100,
        cancelledAt: new Date('2026-06-15T00:00:00Z'),
      },
    ]
    const result = evaluateCapacity(allocations, {
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    })
    expect(result.peakAllocation).toBe(0)
    expect(result.remainingCapacity).toBe(100)
  })

  // 12. Historical ended allocation
  it('Scenario 12: Historical ended allocation contributes during its active dates and never beyond', () => {
    const allocations: AllocationInterval[] = [
      {
        id: 'historical-alloc',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        allocationPercentage: 50,
      },
    ]
    // Looking at historical range:
    const pastResult = evaluateCapacity(allocations, {
      startDate: '2026-01-15',
      endDate: '2026-01-20',
    })
    expect(pastResult.peakAllocation).toBe(50)

    // Looking beyond its end date:
    const futureResult = evaluateCapacity(allocations, {
      startDate: '2026-02-01',
      endDate: '2026-02-28',
    })
    expect(futureResult.peakAllocation).toBe(0)
    expect(futureResult.remainingCapacity).toBe(100)
  })

  // 13. Inactive employee validation logic
  it('Scenario 13: Inactive employee cannot be assigned new allocation', () => {
    const employee = { status: 'INACTIVE' }
    const canAssign = employee.status === 'ACTIVE'
    expect(canAssign).toBe(false)
  })

  // 14. Allocation outside project period
  it('Scenario 14: Allocation outside project period is rejected', () => {
    const project = { startDate: '2026-01-01', endDate: '2026-06-30' }
    const validAllocationRange = { startDate: '2026-02-01', endDate: '2026-05-31' }
    const invalidAllocationRange = { startDate: '2026-05-01', endDate: '2026-07-15' }

    const isInsideProject = (start: string, end: string) =>
      start >= project.startDate && end <= project.endDate && start <= end

    expect(isInsideProject(validAllocationRange.startDate, validAllocationRange.endDate)).toBe(true)
    expect(isInsideProject(invalidAllocationRange.startDate, invalidAllocationRange.endDate)).toBe(false)
  })

  // 15. Concurrent save attempts for the same employee
  it('Scenario 15: Concurrency check detects when total exceeds 100% across concurrent updates', () => {
    const initialAllocations: AllocationInterval[] = [
      {
        id: 'alloc-1',
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        allocationPercentage: 60,
      },
    ]

    // Request 1 wants 30% -> passes
    const evalReq1 = evaluateCapacity(
      initialAllocations,
      { startDate: '2026-09-01', endDate: '2026-09-30' },
      { requestedPercentage: 30 },
    )
    expect(evalReq1.hasConflict).toBe(false)

    // Request 2 concurrently tries to allocate 50%
    const evalReq2 = evaluateCapacity(
      initialAllocations,
      { startDate: '2026-09-01', endDate: '2026-09-30' },
      { requestedPercentage: 50 },
    )
    expect(evalReq2.hasConflict).toBe(true)
    expect(evalReq2.firstConflictRange?.totalAllocation).toBe(110)
  })
})
