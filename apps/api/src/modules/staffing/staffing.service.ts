import type { AuthenticatedUser } from '../../common/auth/types.js'
import { staffingRepository } from './staffing.repository.js'
import { staffingPolicy } from './staffing.policy.js'
import { NotFoundError, NotImplementedError } from '../../common/errors/app-error.js'
import type {
  CreateStaffingRequirementInput,
  UpdateStaffingRequirementInput,
} from './staffing.schema.js'

export const staffingService = {
  async getRequirementsForProject(projectId: string) {
    return staffingRepository.findByProjectId(projectId)
  },

  async createRequirement(
    projectId: string,
    data: CreateStaffingRequirementInput,
    user: AuthenticatedUser,
  ) {
    const project = await staffingRepository.findProjectById(projectId)
    if (!project) {
      throw new NotFoundError('Project not found.')
    }
    staffingPolicy.assertCanManage(user, project.projectManagerEmployeeId, 'Project not found.')

    return staffingRepository.create({
      projectId,
      jobRoleId: data.jobRoleId,
      headcount: data.headcount,
      allocationPercentage: data.allocationPercentage,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      skills: data.skills,
      createdBy: user.id,
    })
  },

  async updateRequirement(
    id: string,
    data: UpdateStaffingRequirementInput,
    user: AuthenticatedUser,
  ) {
    const requirement = await staffingRepository.findById(id)
    if (!requirement) {
      throw new NotFoundError('Staffing requirement not found.')
    }
    staffingPolicy.assertCanManage(
      user,
      requirement.project.projectManagerEmployeeId,
      'Staffing requirement not found.',
    )

    return staffingRepository.update(id, {
      jobRoleId: data.jobRoleId,
      headcount: data.headcount,
      allocationPercentage: data.allocationPercentage,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      skills: data.skills,
      updatedBy: user.id,
    })
  },

  async deleteRequirement(_id: string, _user: AuthenticatedUser) {
    throw new NotImplementedError('Staffing requirement deletion is not implemented in Sprint 1.')
  },
}

