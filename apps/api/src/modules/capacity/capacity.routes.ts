import { Router } from 'express'
import { prisma } from '../../common/database/prisma.js'
import { evaluateCapacity, toDateString } from './capacity.service.js'
import { requireAuth, requireRole } from '../../common/auth/rbac.js'
import { sendSuccess } from '../../common/http/response.js'
import { NotFoundError } from '../../common/errors/app-error.js'

export const capacityRouter = Router()

capacityRouter.use(requireAuth())

capacityRouter.get('/', requireRole('ADMIN', 'RESOURCE_MANAGER', 'PROJECT_MANAGER'), async (req, res, next) => {
  try {
    const today = toDateString(new Date())
    const startDate = (req.query.startDate as string) || today
    const endDate = (req.query.endDate as string) || today
    const departmentId = req.query.departmentId as string | undefined

    const employees = await prisma.employee.findMany({
      where: {
        status: 'ACTIVE',
        ...(departmentId && { departmentId }),
      },
      include: {
        department: true,
        jobRole: true,
        allocations: {
          where: { cancelledAt: null },
        },
      },
      orderBy: { fullName: 'asc' },
    })

    const data = employees.map((emp) => {
      const activeAllocations = emp.allocations.map((a) => ({
        id: a.id,
        startDate: toDateString(a.startDate),
        endDate: toDateString(a.endDate),
        allocationPercentage: a.allocationPercentage,
        cancelledAt: a.cancelledAt,
      }))

      const evaluation = evaluateCapacity(activeAllocations, { startDate, endDate })

      let availabilityStatus = 'PARTIALLY_AVAILABLE'
      if (evaluation.remainingCapacity === 100) {
        availabilityStatus = 'FULLY_AVAILABLE'
      } else if (evaluation.remainingCapacity === 0) {
        availabilityStatus = 'FULLY_ALLOCATED'
      }

      return {
        employeeId: emp.id,
        fullName: emp.fullName,
        jobRoleTitle: emp.jobRole.name,
        departmentName: emp.department.name,
        peakConcurrentAllocation: evaluation.peakAllocation,
        remainingCapacity: evaluation.remainingCapacity,
        availabilityStatus,
      }
    })

    return sendSuccess(res, data)
  } catch (err) {
    next(err)
  }
})

capacityRouter.get('/employee/:employeeId', async (req, res, next) => {
  try {
    const today = toDateString(new Date())
    const startDate = (req.query.startDate as string) || today
    const endDate = (req.query.endDate as string) || today

    const emp = await prisma.employee.findUnique({
      where: { id: req.params.employeeId },
      include: {
        allocations: {
          where: { cancelledAt: null },
        },
      },
    })

    if (!emp) {
      throw new NotFoundError('Employee not found.')
    }

    const activeAllocations = emp.allocations.map((a) => ({
      id: a.id,
      startDate: toDateString(a.startDate),
      endDate: toDateString(a.endDate),
      allocationPercentage: a.allocationPercentage,
      cancelledAt: a.cancelledAt,
    }))

    const evaluation = evaluateCapacity(activeAllocations, { startDate, endDate })

    return sendSuccess(res, {
      employeeId: emp.id,
      startDate,
      endDate,
      peakConcurrentAllocation: evaluation.peakAllocation,
      remainingCapacity: evaluation.remainingCapacity,
    })
  } catch (err) {
    next(err)
  }
})
