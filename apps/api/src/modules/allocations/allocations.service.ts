import { allocationsRepository } from './allocations.repository.js'
import { prisma } from '../../common/database/prisma.js'
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  CapacityConflictError,
} from '../../common/errors/app-error.js'
import {
  evaluateCapacity,
  toDateString,
  buildCapacityConflictDetail,
} from '../capacity/capacity.service.js'
import type { AuthenticatedUser } from '../../common/auth/types.js'

function formatAllocationResponse(a: {
  id: string
  employeeId: string
  employee?: { fullName: string }
  projectId: string
  project?: { name: string; projectCode: string }
  jobRoleId: string
  jobRole?: { name: string }
  staffingRequirementId: string | null
  allocationPercentage: number
  startDate: Date
  endDate: Date
  cancelledAt: Date | null
}) {
  const today = toDateString(new Date())
  const startStr = toDateString(a.startDate)
  const endStr = toDateString(a.endDate)

  let displayStatus = 'ACTIVE'
  if (a.cancelledAt) {
    displayStatus = 'CANCELLED'
  } else if (startStr > today) {
    displayStatus = 'PLANNED'
  } else if (endStr < today) {
    displayStatus = 'ENDED'
  }

  return {
    id: a.id,
    employeeId: a.employeeId,
    employeeName: a.employee?.fullName,
    projectId: a.projectId,
    projectName: a.project?.name,
    projectCode: a.project?.projectCode,
    jobRoleId: a.jobRoleId,
    jobRoleTitle: a.jobRole?.name,
    staffingRequirementId: a.staffingRequirementId,
    allocationPercentage: a.allocationPercentage,
    startDate: startStr,
    endDate: endStr,
    displayStatus,
    cancelledAt: a.cancelledAt,
  }
}

export const allocationsService = {
  async getAllocations(params?: {
    employeeId?: string
    projectId?: string
    startDate?: string
    endDate?: string
  }) {
    const list = await allocationsRepository.findAll(params)
    return list.map(formatAllocationResponse)
  },

  async getAllocationById(id: string) {
    const allocation = await allocationsRepository.findById(id)
    if (!allocation) {
      throw new NotFoundError('Allocation not found.')
    }
    return formatAllocationResponse(allocation)
  },

  async createAllocation(
    input: {
      employeeId: string
      projectId: string
      jobRoleId: string
      staffingRequirementId?: string | null
      allocationPercentage: number
      startDate: string
      endDate: string
    },
    user: AuthenticatedUser,
  ) {
    // 1. Begin transaction to execute row lock and atomic capacity validation
    return prisma.$transaction(async (tx) => {
      // 2. Lock employee row using SELECT ... FOR UPDATE (TSD 10.4 / ADR-009)
      const lockedEmployees = await tx.$queryRawUnsafe<Array<{ id: string; status: string }>>(
        'SELECT id, status FROM employees WHERE id = $1::uuid FOR UPDATE',
        input.employeeId,
      )

      if (!lockedEmployees.length) {
        throw new NotFoundError('Employee not found.')
      }

      const employee = lockedEmployees[0]
      if (!employee) {
        throw new NotFoundError('Employee not found.')
      }

      // BR-G11: Only Active employee can receive new allocations
      if (employee.status !== 'ACTIVE') {
        throw new BadRequestError('Cannot create allocation for an inactive employee.')
      }

      // Check project
      const project = await tx.project.findUnique({
        where: { id: input.projectId },
      })
      if (!project) {
        throw new NotFoundError('Project not found.')
      }

      // BR-G04: Project Manager authorization check
      if (user.role === 'PROJECT_MANAGER' && project.projectManagerEmployeeId !== user.employeeId) {
        throw new ForbiddenError('You can only create allocations for your assigned projects.')
      }

      // BR-G13: Completed / Archived project does not accept new allocations
      if (['COMPLETED', 'ARCHIVED'].includes(project.status)) {
        throw new BadRequestError(`Cannot allocate resources to a ${project.status.toLowerCase()} project.`)
      }

      // BR-G10: Allocation period must remain within project period
      const projStart = toDateString(project.startDate)
      const projEnd = toDateString(project.endDate)
      if (input.startDate < projStart || input.endDate > projEnd) {
        throw new BadRequestError('Allocation dates must be inside project start and end dates.')
      }

      // 3. Read latest committed non-cancelled employee allocations
      const existingAllocations = await tx.allocation.findMany({
        where: {
          employeeId: input.employeeId,
          cancelledAt: null,
        },
      })

      const allocationIntervals = existingAllocations.map((a) => ({
        id: a.id,
        startDate: toDateString(a.startDate),
        endDate: toDateString(a.endDate),
        allocationPercentage: a.allocationPercentage,
        cancelledAt: a.cancelledAt,
      }))

      // 4. Run deterministic capacity evaluation (TSD 10.3)
      const evaluation = evaluateCapacity(
        allocationIntervals,
        { startDate: input.startDate, endDate: input.endDate },
        { requestedPercentage: input.allocationPercentage },
      )

      if (evaluation.hasConflict) {
        const conflictDetail = buildCapacityConflictDetail(evaluation, input.allocationPercentage, {
          startDate: input.startDate,
          endDate: input.endDate,
        })
        throw new CapacityConflictError(conflictDetail)
      }

      // 5. Persist allocation
      const saved = await tx.allocation.create({
        data: {
          employeeId: input.employeeId,
          projectId: input.projectId,
          jobRoleId: input.jobRoleId,
          staffingRequirementId: input.staffingRequirementId,
          allocationPercentage: input.allocationPercentage,
          startDate: new Date(input.startDate + 'T00:00:00Z'),
          endDate: new Date(input.endDate + 'T00:00:00Z'),
          createdBy: user.id,
        },
        include: {
          employee: true,
          project: true,
          jobRole: true,
        },
      })

      return formatAllocationResponse(saved)
    })
  },

  async updateAllocation(
    id: string,
    input: {
      jobRoleId?: string
      allocationPercentage?: number
      startDate?: string
      endDate?: string
    },
    user: AuthenticatedUser,
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.allocation.findUnique({
        where: { id },
        include: { project: true },
      })
      if (!existing) {
        throw new NotFoundError('Allocation not found.')
      }

      // Lock employee row
      await tx.$queryRawUnsafe(
        'SELECT id, status FROM employees WHERE id = $1::uuid FOR UPDATE',
        existing.employeeId,
      )

      // Project Manager permission
      if (user.role === 'PROJECT_MANAGER' && existing.project.projectManagerEmployeeId !== user.employeeId) {
        throw new ForbiddenError('You can only modify allocations for your assigned projects.')
      }

      const targetStartDate = input.startDate || toDateString(existing.startDate)
      const targetEndDate = input.endDate || toDateString(existing.endDate)
      const targetPercentage = input.allocationPercentage ?? existing.allocationPercentage

      // Validate project boundaries
      const projStart = toDateString(existing.project.startDate)
      const projEnd = toDateString(existing.project.endDate)
      if (targetStartDate < projStart || targetEndDate > projEnd) {
        throw new BadRequestError('Allocation dates must be inside project start and end dates.')
      }

      // Revalidate capacity, excluding current allocation
      const currentAllocations = await tx.allocation.findMany({
        where: {
          employeeId: existing.employeeId,
          cancelledAt: null,
        },
      })

      const intervals = currentAllocations.map((a) => ({
        id: a.id,
        startDate: toDateString(a.startDate),
        endDate: toDateString(a.endDate),
        allocationPercentage: a.allocationPercentage,
        cancelledAt: a.cancelledAt,
      }))

      const evaluation = evaluateCapacity(
        intervals,
        { startDate: targetStartDate, endDate: targetEndDate },
        {
          excludeAllocationId: id,
          requestedPercentage: targetPercentage,
        },
      )

      if (evaluation.hasConflict) {
        const conflictDetail = buildCapacityConflictDetail(evaluation, targetPercentage, {
          startDate: targetStartDate,
          endDate: targetEndDate,
        })
        throw new CapacityConflictError(conflictDetail)
      }

      const updated = await tx.allocation.update({
        where: { id },
        data: {
          ...(input.jobRoleId && { jobRoleId: input.jobRoleId }),
          ...(input.allocationPercentage && { allocationPercentage: input.allocationPercentage }),
          ...(input.startDate && { startDate: new Date(input.startDate + 'T00:00:00Z') }),
          ...(input.endDate && { endDate: new Date(input.endDate + 'T00:00:00Z') }),
          updatedBy: user.id,
        },
        include: {
          employee: true,
          project: true,
          jobRole: true,
        },
      })

      return formatAllocationResponse(updated)
    })
  },

  async endAllocation(id: string, newEndDate: string, user: AuthenticatedUser) {
    const existing = await allocationsRepository.findById(id)
    if (!existing) {
      throw new NotFoundError('Allocation not found.')
    }

    if (user.role === 'PROJECT_MANAGER' && existing.project.projectManagerEmployeeId !== user.employeeId) {
      throw new ForbiddenError('You can only modify allocations for your assigned projects.')
    }

    const startStr = toDateString(existing.startDate)
    if (newEndDate < startStr) {
      throw new BadRequestError('Effective end date cannot be before allocation start date.')
    }

    const updated = await allocationsRepository.end(id, new Date(newEndDate + 'T00:00:00Z'), user.id)
    return formatAllocationResponse(updated)
  },

  async cancelAllocation(id: string, user: AuthenticatedUser) {
    const existing = await allocationsRepository.findById(id)
    if (!existing) {
      throw new NotFoundError('Allocation not found.')
    }

    if (user.role === 'PROJECT_MANAGER' && existing.project.projectManagerEmployeeId !== user.employeeId) {
      throw new ForbiddenError('You can only modify allocations for your assigned projects.')
    }

    const updated = await allocationsRepository.cancel(id, user.id)
    return formatAllocationResponse(updated)
  },
}
