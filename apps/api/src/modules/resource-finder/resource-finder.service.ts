import { prisma } from '../../common/database/prisma.js'
import { evaluateCapacity, toDateString } from '../capacity/capacity.service.js'

export const resourceFinderService = {
  async searchResources(params: {
    startDate: string
    endDate: string
    jobRoleId?: string
    departmentId?: string
    skillId?: string
    minProficiency?: number
    minRemainingCapacity?: number
  }) {
    // Only search ACTIVE employees (AC01.04)
    const employees = await prisma.employee.findMany({
      where: {
        status: 'ACTIVE',
        ...(params.departmentId && { departmentId: params.departmentId }),
        ...(params.jobRoleId && { jobRoleId: params.jobRoleId }),
        ...(params.skillId && {
          skills: {
            some: {
              skillId: params.skillId,
              ...(params.minProficiency && {
                proficiencyLevel: { gte: params.minProficiency },
              }),
            },
          },
        }),
      },
      include: {
        department: true,
        jobRole: true,
        skills: {
          include: { skill: true },
        },
        allocations: {
          where: { cancelledAt: null },
        },
      },
      orderBy: { fullName: 'asc' },
    })

    const results = employees.map((emp) => {
      const activeAllocations = emp.allocations.map((a) => ({
        id: a.id,
        startDate: toDateString(a.startDate),
        endDate: toDateString(a.endDate),
        allocationPercentage: a.allocationPercentage,
        cancelledAt: a.cancelledAt,
      }))

      const evaluation = evaluateCapacity(activeAllocations, {
        startDate: params.startDate,
        endDate: params.endDate,
      })

      const isAssignable =
        params.minRemainingCapacity !== undefined
          ? evaluation.remainingCapacity >= params.minRemainingCapacity
          : evaluation.remainingCapacity > 0

      return {
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        fullName: emp.fullName,
        workEmail: emp.workEmail,
        jobRoleId: emp.jobRoleId,
        jobRoleTitle: emp.jobRole.name,
        departmentId: emp.departmentId,
        departmentName: emp.department.name,
        peakConcurrentAllocation: evaluation.peakAllocation,
        remainingCapacity: evaluation.remainingCapacity,
        isAssignable,
        skills: emp.skills.map((s) => ({
          id: s.id,
          skillId: s.skillId,
          skillName: s.skill.name,
          proficiencyLevel: s.proficiencyLevel,
        })),
      }
    })

    // If minRemainingCapacity filter is applied, filter results
    const filtered =
      params.minRemainingCapacity !== undefined
        ? results.filter((r) => r.remainingCapacity >= params.minRemainingCapacity!)
        : results

    return {
      data: filtered,
      meta: {
        startDate: params.startDate,
        endDate: params.endDate,
        totalResults: filtered.length,
      },
    }
  },
}
