import { staffingRepository } from './staffing.repository.js'
import { projectsRepository } from '../projects/projects.repository.js'
import { NotFoundError, BadRequestError, ForbiddenError } from '../../common/errors/app-error.js'
import { toDateString } from '../capacity/capacity.service.js'
import type { AuthenticatedUser } from '../../common/auth/types.js'

export const staffingService = {
  async getRequirementsForProject(projectId: string) {
    const list = await staffingRepository.findByProjectId(projectId)
    return list.map((r) => {
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
    })
  },

  async createRequirement(
    projectId: string,
    input: {
      jobRoleId: string
      headcount: number
      allocationPercentage: number
      startDate: string
      endDate: string
      skills?: Array<{ skillId: string; minimumProficiencyLevel: number }>
    },
    user: AuthenticatedUser,
  ) {
    const project = await projectsRepository.findById(projectId)
    if (!project) {
      throw new NotFoundError('Project not found.')
    }

    if (user.role === 'PROJECT_MANAGER' && project.projectManagerEmployeeId !== user.employeeId) {
      throw new ForbiddenError('You can only manage staffing for your assigned projects.')
    }

    const projStart = toDateString(project.startDate)
    const projEnd = toDateString(project.endDate)

    if (input.startDate < projStart || input.endDate > projEnd) {
      throw new BadRequestError('Requirement dates must be within project period.')
    }

    if (input.endDate < input.startDate) {
      throw new BadRequestError('Requirement end date must be on or after start date.')
    }

    const created = await staffingRepository.create({
      projectId,
      jobRoleId: input.jobRoleId,
      headcount: input.headcount,
      allocationPercentage: input.allocationPercentage,
      startDate: new Date(input.startDate + 'T00:00:00Z'),
      endDate: new Date(input.endDate + 'T00:00:00Z'),
      skills: input.skills,
      createdBy: user.id,
    })

    return {
      id: created.id,
      projectId: created.projectId,
      jobRoleId: created.jobRoleId,
      jobRoleTitle: created.jobRole.name,
      headcount: created.headcount,
      filledHeadcount: 0,
      allocationPercentage: created.allocationPercentage,
      startDate: toDateString(created.startDate),
      endDate: toDateString(created.endDate),
      status: 'OPEN',
      skills: created.skills.map((s) => ({
        skillId: s.skillId,
        skillName: s.skill.name,
        minimumProficiencyLevel: s.minimumProficiencyLevel,
      })),
    }
  },

  async updateRequirement(
    id: string,
    input: {
      jobRoleId?: string
      headcount?: number
      allocationPercentage?: number
      startDate?: string
      endDate?: string
      skills?: Array<{ skillId: string; minimumProficiencyLevel: number }>
    },
    user: AuthenticatedUser,
  ) {
    const existing = await staffingRepository.findById(id)
    if (!existing) {
      throw new NotFoundError('Staffing requirement not found.')
    }

    if (user.role === 'PROJECT_MANAGER' && existing.project.projectManagerEmployeeId !== user.employeeId) {
      throw new ForbiddenError('You can only manage staffing for your assigned projects.')
    }

    const projStart = toDateString(existing.project.startDate)
    const projEnd = toDateString(existing.project.endDate)
    const newStart = input.startDate || toDateString(existing.startDate)
    const newEnd = input.endDate || toDateString(existing.endDate)

    if (newStart < projStart || newEnd > projEnd) {
      throw new BadRequestError('Requirement dates must be within project period.')
    }

    if (newEnd < newStart) {
      throw new BadRequestError('Requirement end date must be on or after start date.')
    }

    const updated = await staffingRepository.update(id, {
      ...input,
      startDate: input.startDate ? new Date(input.startDate + 'T00:00:00Z') : undefined,
      endDate: input.endDate ? new Date(input.endDate + 'T00:00:00Z') : undefined,
      updatedBy: user.id,
    })

    const filledHeadcount = updated.allocations.length

    return {
      id: updated.id,
      projectId: updated.projectId,
      jobRoleId: updated.jobRoleId,
      jobRoleTitle: updated.jobRole.name,
      headcount: updated.headcount,
      filledHeadcount,
      allocationPercentage: updated.allocationPercentage,
      startDate: toDateString(updated.startDate),
      endDate: toDateString(updated.endDate),
      status: filledHeadcount >= updated.headcount ? 'FULFILLED' : 'OPEN',
      skills: updated.skills.map((s) => ({
        skillId: s.skillId,
        skillName: s.skill.name,
        minimumProficiencyLevel: s.minimumProficiencyLevel,
      })),
    }
  },

  async deleteRequirement(id: string, user: AuthenticatedUser) {
    const existing = await staffingRepository.findById(id)
    if (!existing) {
      throw new NotFoundError('Staffing requirement not found.')
    }

    if (user.role === 'PROJECT_MANAGER' && existing.project.projectManagerEmployeeId !== user.employeeId) {
      throw new ForbiddenError('You can only manage staffing for your assigned projects.')
    }

    await staffingRepository.delete(id)
  },
}
