import { Router } from 'express'
import { requireAuth } from '../../common/auth/rbac.js'
import { sendSuccess } from '../../common/http/response.js'

export const dashboardRouter = Router()
dashboardRouter.use(requireAuth())

dashboardRouter.get('/', async (_req, res, next) => {
  try {
    // TODO: Implement dashboard metrics aggregation in Sprint (PIC: Saiful & Jundy)
    return sendSuccess(res, {
      totalActiveResources: 0,
      totalActiveProjects: 0,
      fullyAvailableResources: 0,
      fullyAllocatedResources: 0,
      openStaffingRequirements: 0,
      capacityDistribution: {
        fullyAvailable: 0,
        partiallyAvailable: 0,
        fullyAllocated: 0,
      },
      accessibleProjects: [],
    })
  } catch (err) {
    next(err)
  }
})

export const meRouter = Router()
meRouter.use(requireAuth())

meRouter.get('/', async (req, res, next) => {
  try {
    const user = req.user!
    // TODO: Implement employee self-view profile in Sprint (PIC: Saiful & Jundy)
    return sendSuccess(res, {
      profile: {
        id: user.employeeId ?? user.id,
        fullName: user.employee?.fullName ?? user.email,
        workEmail: user.email,
        departmentName: user.employee?.departmentName ?? 'Engineering',
        jobRoleTitle: user.employee?.jobRoleTitle ?? 'Developer',
        status: 'ACTIVE',
      },
      skills: [],
      currentAllocations: [],
      plannedAllocations: [],
      currentTotalAllocation: 0,
      remainingCapacity: 100,
    })
  } catch (err) {
    next(err)
  }
})
