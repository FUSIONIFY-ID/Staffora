import type { AuthenticatedUser } from '../../common/auth/types.js'
import { assertCanManageAllocation } from '../../common/auth/policy.js'
import { NotFoundError } from '../../common/errors/app-error.js'
import { allocationsRepository } from './allocations.repository.js'
import type {
  CreateAllocationInput,
  UpdateAllocationInput,
  EndAllocationInput,
} from './allocations.schema.js'

export const allocationsService = {
  async getAllocations(_query: Record<string, unknown>, _user: AuthenticatedUser) {
    // TODO: Implement allocations query in Sprint (PIC: Saiful & Jundy)
    return {
      data: [],
      total: 0,
      page: 1,
      pageSize: 10,
    }
  },

  async getAllocationById(id: string, _user: AuthenticatedUser) {
    // TODO: Implement single allocation query in Sprint (PIC: Saiful & Jundy)
    return { id }
  },

  async createAllocation(data: Partial<CreateAllocationInput>, user: AuthenticatedUser) {
    // TODO: Implement allocation creation with SELECT ... FOR UPDATE capacity lock in Sprint (PIC: Saiful & Jundy)
    const projectId = data.projectId
    if (projectId) {
      const project = await allocationsRepository.findProjectById(projectId)
      if (!project) {
        throw new NotFoundError('Project not found')
      }

      assertCanManageAllocation(user, project.projectManagerEmployeeId)
    }

    return null
  },

  async updateAllocation(id: string, _data: UpdateAllocationInput, user: AuthenticatedUser) {
    // TODO: Implement allocation update with concurrency protection in Sprint (PIC: Saiful & Jundy)
    const allocation = await allocationsRepository.findById(id)
    if (!allocation) {
      throw new NotFoundError('Allocation not found.')
    }
    assertCanManageAllocation(user, allocation.project.projectManagerEmployeeId)
    return allocation
  },

  async endAllocation(id: string, _data: EndAllocationInput, user: AuthenticatedUser) {
    // TODO: Implement ending an allocation in Sprint (PIC: Saiful & Jundy)
    const allocation = await allocationsRepository.findById(id)
    if (!allocation) {
      throw new NotFoundError('Allocation not found.')
    }
    assertCanManageAllocation(user, allocation.project.projectManagerEmployeeId)
    return { id }
  },


  async cancelAllocation(id: string, user: AuthenticatedUser) {
    // TODO: Implement allocation cancellation in Sprint (PIC: Saiful & Jundy)
    const allocation = await allocationsRepository.findById(id)
    if (!allocation) {
      throw new NotFoundError('Allocation not found.')
    }
    assertCanManageAllocation(user, allocation.project.projectManagerEmployeeId)
  },
}
