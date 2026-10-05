export interface AllocationInterval {
  id?: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  allocationPercentage: number
  cancelledAt?: Date | string | null
}

export interface CapacityEvaluationResult {
  peakAllocation: number
  remainingCapacity: number
  hasConflict: boolean
  firstConflictRange?: {
    startDate: string
    endDate: string
    totalAllocation: number
  }
  dailyTimeline?: Array<{
    date: string
    concurrentAllocation: number
    remainingCapacity: number
  }>
}

export interface CapacityConflictDetail {
  peakAllocation: number
  requestedAllocation: number
  remainingCapacity: number
  conflictStartDate: string
  conflictEndDate: string
}
