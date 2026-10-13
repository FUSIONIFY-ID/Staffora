import type { AuthenticatedUser } from '../../common/auth/types.js'
import { assertCanManageAllocation } from '../../common/auth/policy.js'
import { NotFoundError, NotImplementedError } from '../../common/errors/app-error.js'
import { allocationsRepository } from './allocations.repository.js'
import type {
  CreateAllocationInput,
  UpdateAllocationInput,
  EndAllocationInput,
} from './allocations.schema.js'

export const allocationsService = {
  async getAllocations(_query: Record<string, unknown>, _user: AuthenticatedUser) {
    // TODO: Implement allocations query in Sprint 2 (US04)
    return {
      data: [],
      total: 0,
      page: 1,
      pageSize: 10,
    }
  },

  async getAllocationById(_id: string, _user: AuthenticatedUser) {
    throw new NotImplementedError('Fetching single allocation is not implemented in Sprint 1.')
  },

  async createAllocation(data: CreateAllocationInput, user: AuthenticatedUser) {
    const project = await allocationsRepository.findProjectById(data.projectId)
    if (!project) {
      throw new NotFoundError('Project not found')
    }

    assertCanManageAllocation(user, project.projectManagerEmployeeId)

    throw new NotImplementedError('Allocation creation is not implemented in Sprint 1.')
  },

  async updateAllocation(id: string, _data: UpdateAllocationInput, user: AuthenticatedUser) {
    const allocation = await allocationsRepository.findById(id)
    if (!allocation) {
      throw new NotFoundError('Allocation not found.')
    }
    assertCanManageAllocation(user, allocation.project.projectManagerEmployeeId)
    throw new NotImplementedError('Allocation update is not implemented in Sprint 1.')
  },

  async endAllocation(id: string, _data: EndAllocationInput, user: AuthenticatedUser) {
    const allocation = await allocationsRepository.findById(id)
    if (!allocation) {
      throw new NotFoundError('Allocation not found.')
    }
    assertCanManageAllocation(user, allocation.project.projectManagerEmployeeId)
    throw new NotImplementedError('Ending allocation is not implemented in Sprint 1.')
  },

  async cancelAllocation(id: string, user: AuthenticatedUser) {
    const allocation = await allocationsRepository.findById(id)
    if (!allocation) {
      throw new NotFoundError('Allocation not found.')
    }
    assertCanManageAllocation(user, allocation.project.projectManagerEmployeeId)
    throw new NotImplementedError('Cancelling allocation is not implemented in Sprint 1.')
  },
}
