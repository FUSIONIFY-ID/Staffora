import { Router } from 'express'
import { prisma } from '../../common/database/prisma.js'
import { evaluateCapacity, toDateString } from '../capacity/capacity.service.js'
import { requireAuth } from '../../common/auth/rbac.js'
import { sendSuccess } from '../../common/http/response.js'
import { NotFoundError } from '../../common/errors/app-error.js'

export const dashboardRouter = Router()
dashboardRouter.use(requireAuth())

dashboardRouter.get('/', async (req, res, next) => {
  try {
    const today = toDateString(new Date())
    const startDate = (req.query.startDate as string) || today
    const endDate = (req.query.endDate as string) || today

    const user = req.user!

    // Fetch active resources
    const employees = await prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      include: {
        allocations: {
          where: { cancelledAt: null },
        },
      },
    })

    let fullyAvailable = 0
    let partiallyAvailable = 0
    let fullyAllocated = 0

    for (const emp of employees) {
      const activeAllocations = emp.allocations.map((a) => ({
        id: a.id,
        startDate: toDateString(a.startDate),
        endDate: toDateString(a.endDate),
        allocationPercentage: a.allocationPercentage,
        cancelledAt: a.cancelledAt,
      }))

      const evaluation = evaluateCapacity(activeAllocations, { startDate, endDate })
      if (evaluation.remainingCapacity === 100) {
        fullyAvailable++
      } else if (evaluation.remainingCapacity === 0) {
        fullyAllocated++
      } else {
        partiallyAvailable++
      }
    }

    // Fetch accessible projects
    const projectWhere: Record<string, unknown> = {
      status: { in: ['PLANNED', 'ACTIVE'] },
    }

    if (user.role === 'PROJECT_MANAGER' && user.employeeId) {
      projectWhere.projectManagerEmployeeId = user.employeeId
    }

    const [projects, openRequirementsCount] = await Promise.all([
      prisma.project.findMany({
        where: projectWhere,
        include: {
          projectManager: true,
          staffingRequirements: {
            include: {
              allocations: { where: { cancelledAt: null } },
            },
          },
          allocations: {
            where: { cancelledAt: null },
          },
        },
        orderBy: { startDate: 'asc' },
      }),
      prisma.staffingRequirement.count({
        where: {
          project: {
            status: { in: ['PLANNED', 'ACTIVE'] },
            ...(user.role === 'PROJECT_MANAGER' && user.employeeId ? { projectManagerEmployeeId: user.employeeId } : {}),
          },
        },
      }),
    ])

    const totalActiveProjects = projects.length

    return sendSuccess(res, {
      totalActiveResources: employees.length,
      totalActiveProjects,
      fullyAvailableResources: fullyAvailable,
      fullyAllocatedResources: fullyAllocated,
      openStaffingRequirements: openRequirementsCount,
      capacityDistribution: {
        fullyAvailable,
        partiallyAvailable,
        fullyAllocated,
      },
      accessibleProjects: projects.map((p) => ({
        id: p.id,
        projectCode: p.projectCode,
        name: p.name,
        projectManagerName: p.projectManager.fullName,
        startDate: toDateString(p.startDate),
        endDate: toDateString(p.endDate),
        status: p.status,
        staffingRequirementCount: p.staffingRequirements.length,
        allocatedResourceCount: p.allocations.length,
      })),
    })
  } catch (err) {
    next(err)
  }
})

// /api/v1/me (Employee Self-View - US06.02)
export const meRouter = Router()
meRouter.use(requireAuth())

meRouter.get('/', async (req, res, next) => {
  try {
    const user = req.user!
    if (!user.employeeId) {
      return sendSuccess(res, {
        profile: null,
        skills: [],
        currentAllocations: [],
        plannedAllocations: [],
        currentTotalAllocation: 0,
        remainingCapacity: 100,
      })
    }

    const employee = await prisma.employee.findUnique({
      where: { id: user.employeeId },
      include: {
        department: true,
        jobRole: true,
        skills: {
          include: { skill: true },
        },
        allocations: {
          where: { cancelledAt: null },
          include: {
            project: true,
            jobRole: true,
          },
          orderBy: { startDate: 'asc' },
        },
      },
    })

    if (!employee) {
      throw new NotFoundError('Employee profile not found.')
    }

    const today = toDateString(new Date())

    const currentAllocations: Array<Record<string, unknown>> = []
    const plannedAllocations: Array<Record<string, unknown>> = []

    for (const a of employee.allocations) {
      const startStr = toDateString(a.startDate)
      const endStr = toDateString(a.endDate)

      let displayStatus = 'ACTIVE'
      if (startStr > today) {
        displayStatus = 'PLANNED'
        plannedAllocations.push({
          id: a.id,
          projectCode: a.project.projectCode,
          projectName: a.project.name,
          jobRoleTitle: a.jobRole.name,
          allocationPercentage: a.allocationPercentage,
          startDate: startStr,
          endDate: endStr,
          status: displayStatus,
        })
      } else if (endStr >= today && startStr <= today) {
        displayStatus = 'ACTIVE'
        currentAllocations.push({
          id: a.id,
          projectCode: a.project.projectCode,
          projectName: a.project.name,
          jobRoleTitle: a.jobRole.name,
          allocationPercentage: a.allocationPercentage,
          startDate: startStr,
          endDate: endStr,
          status: displayStatus,
        })
      }
    }

    const activeAllocations = employee.allocations.map((a) => ({
      id: a.id,
      startDate: toDateString(a.startDate),
      endDate: toDateString(a.endDate),
      allocationPercentage: a.allocationPercentage,
      cancelledAt: a.cancelledAt,
    }))

    const todayCapacity = evaluateCapacity(activeAllocations, {
      startDate: today,
      endDate: today,
    })

    return sendSuccess(res, {
      profile: {
        id: employee.id,
        employeeCode: employee.employeeCode,
        fullName: employee.fullName,
        workEmail: employee.workEmail,
        departmentName: employee.department.name,
        jobRoleTitle: employee.jobRole.name,
        status: employee.status,
      },
      skills: employee.skills.map((s) => ({
        id: s.id,
        skillId: s.skillId,
        skillName: s.skill.name,
        proficiencyLevel: s.proficiencyLevel,
      })),
      currentAllocations,
      plannedAllocations,
      currentTotalAllocation: todayCapacity.peakAllocation,
      remainingCapacity: todayCapacity.remainingCapacity,
    })
  } catch (err) {
    next(err)
  }
})
