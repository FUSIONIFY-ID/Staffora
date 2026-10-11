import type { AuthenticatedUser } from '../../common/auth/types.js'
import { staffingRepository } from './staffing.repository.js'
import { staffingPolicy } from './staffing.policy.js'
import { NotFoundError } from '../../common/errors/app-error.js'

export const staffingService = {
  async getRequirementsForProject(_projectId: string) {
    // TODO: Implement staffing requirements query in Sprint 1/2 (PIC: Saiful & Jundy)
    return []
  },

  async createRequirement(projectId: string, _data: Record<string, unknown>, user: AuthenticatedUser) {
    const project = await staffingRepository.findProjectById(projectId)
    if (!project) {
      throw new NotFoundError('Project not found.')
    }
    staffingPolicy.assertCanManage(user, project.projectManagerEmployeeId, 'Project not found.')

    // Scaffold response
    return {
      id: 'scaffold-requirement-id',
      projectId,
    }
  },

  async updateRequirement(id: string, _data: Record<string, unknown>, user: AuthenticatedUser) {
    const requirement = await staffingRepository.findById(id)
    if (!requirement) {
      throw new NotFoundError('Staffing requirement not found.')
    }
    staffingPolicy.assertCanManage(
      user,
      requirement.project.projectManagerEmployeeId,
      'Staffing requirement not found.',
    )

    return requirement
  },

  async deleteRequirement(id: string, user: AuthenticatedUser) {
    const requirement = await staffingRepository.findById(id)
    if (!requirement) {
      throw new NotFoundError('Staffing requirement not found.')
    }
    staffingPolicy.assertCanManage(
      user,
      requirement.project.projectManagerEmployeeId,
      'Staffing requirement not found.',
    )
  },
}
