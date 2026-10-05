import { projectsRepository } from './projects.repository.js'
import { ConflictError, NotFoundError, ForbiddenError, BadRequestError } from '../../common/errors/app-error.js'
import { toDateString } from '../capacity/capacity.service.js'
import type { AuthenticatedUser } from '../../common/auth/types.js'
import type { ProjectStatus } from '../../generated/prisma/client.js'

export const projectsService = {
  async getProjects(
    params: {
      search?: string
      status?: ProjectStatus
      projectManagerEmployeeId?: string
      page: number
      pageSize: number
    },
    user: AuthenticatedUser,
  ) {
    let allocatedEmployeeId: string | undefined
    if (user.role === 'EMPLOYEE') {
      if (!user.employeeId) {
        return { data: [], total: 0, page: params.page, pageSize: params.pageSize }
      }
      allocatedEmployeeId = user.employeeId
    }

    const { data, total } = await projectsRepository.findProjects({
      ...params,
      allocatedEmployeeId,
    })

    const mapped = data.map((p) => ({
      id: p.id,
      projectCode: p.projectCode,
      name: p.name,
      projectManagerEmployeeId: p.projectManagerEmployeeId,
      projectManagerName: p.projectManager.fullName,
      startDate: toDateString(p.startDate),
      endDate: toDateString(p.endDate),
      status: p.status,
      staffingRequirementCount: p.staffingRequirements.length,
      allocatedResourceCount: p.allocations.length,
    }))

    return {
      data: mapped,
      total,
      page: params.page,
      pageSize: params.pageSize,
    }
  },

  async getProjectDetail(id: string, user: AuthenticatedUser) {
    const project = await projectsRepository.findById(id)
    if (!project) {
      throw new NotFoundError('Project not found.')
    }

    // Role visibility checks
    if (user.role === 'EMPLOYEE') {
      const isAllocated = project.allocations.some((a) => a.employeeId === user.employeeId)
      if (!isAllocated) {
        throw new ForbiddenError('You do not have access to view this project.')
      }
    }

    const today = toDateString(new Date())

    return {
      id: project.id,
      projectCode: project.projectCode,
      name: project.name,
      projectManagerEmployeeId: project.projectManagerEmployeeId,
      projectManagerName: project.projectManager.fullName,
      startDate: toDateString(project.startDate),
      endDate: toDateString(project.endDate),
      status: project.status,
      staffingRequirements: project.staffingRequirements.map((r) => {
        const filledHeadcount = r.allocations.length
        return {
          id: r.id,
          projectId: r.projectId,
          jobRoleId: r.jobRoleId,
          jobRoleTitle: r.jobRole.name,
          headcount: r.headcount,
          filledHeadcount,
          allocationPercentage: r.allocationPercentage,
          startDate: toDateString(r.startDate),
          endDate: toDateString(r.endDate),
          status: filledHeadcount >= r.headcount ? 'FULFILLED' : 'OPEN',
          skills: r.skills.map((s) => ({
            skillId: s.skillId,
            skillName: s.skill.name,
            minimumProficiencyLevel: s.minimumProficiencyLevel,
          })),
        }
      }),
      allocations: project.allocations.map((a) => {
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
          employeeName: a.employee.fullName,
          projectId: a.projectId,
          projectName: project.name,
          projectCode: project.projectCode,
          jobRoleId: a.jobRoleId,
          jobRoleTitle: a.jobRole.name,
          staffingRequirementId: a.staffingRequirementId,
          allocationPercentage: a.allocationPercentage,
          startDate: startStr,
          endDate: endStr,
          displayStatus,
          cancelledAt: a.cancelledAt,
        }
      }),
    }
  },

  async createProject(
    input: {
      projectCode: string
      name: string
      projectManagerEmployeeId?: string
      startDate: string
      endDate: string
      status?: ProjectStatus
    },
    user: AuthenticatedUser,
  ) {
    const existing = await projectsRepository.findByCode(input.projectCode)
    if (existing) {
      throw new ConflictError('Project code already exists.')
    }

    // Default to current user's employeeId if Project Manager and not specified
    let pmId = input.projectManagerEmployeeId
    if (!pmId) {
      if (user.role === 'PROJECT_MANAGER' && user.employeeId) {
        pmId = user.employeeId
      } else {
        throw new BadRequestError('Project manager employee ID is required.')
      }
    }

    const project = await projectsRepository.create({
      projectCode: input.projectCode,
      name: input.name,
      projectManagerEmployeeId: pmId,
      startDate: new Date(input.startDate + 'T00:00:00Z'),
      endDate: new Date(input.endDate + 'T00:00:00Z'),
      status: input.status || 'DRAFT',
      createdBy: user.id,
    })

    return {
      id: project.id,
      projectCode: project.projectCode,
      name: project.name,
      projectManagerEmployeeId: project.projectManagerEmployeeId,
      projectManagerName: project.projectManager.fullName,
      startDate: toDateString(project.startDate),
      endDate: toDateString(project.endDate),
      status: project.status,
    }
  },

  async updateProject(
    id: string,
    input: {
      name?: string
      projectManagerEmployeeId?: string
      startDate?: string
      endDate?: string
      status?: ProjectStatus
    },
    user: AuthenticatedUser,
  ) {
    const project = await projectsRepository.findById(id)
    if (!project) {
      throw new NotFoundError('Project not found.')
    }

    // BR-G04: Project Manager only mutates assigned projects
    if (user.role === 'PROJECT_MANAGER' && project.projectManagerEmployeeId !== user.employeeId) {
      throw new ForbiddenError('You can only update projects assigned to you.')
    }

    const updated = await projectsRepository.update(id, {
      name: input.name,
      projectManagerEmployeeId: input.projectManagerEmployeeId,
      startDate: input.startDate ? new Date(input.startDate + 'T00:00:00Z') : undefined,
      endDate: input.endDate ? new Date(input.endDate + 'T00:00:00Z') : undefined,
      status: input.status,
      updatedBy: user.id,
    })

    return {
      id: updated.id,
      projectCode: updated.projectCode,
      name: updated.name,
      projectManagerEmployeeId: updated.projectManagerEmployeeId,
      projectManagerName: updated.projectManager.fullName,
      startDate: toDateString(updated.startDate),
      endDate: toDateString(updated.endDate),
      status: updated.status,
    }
  },
}
