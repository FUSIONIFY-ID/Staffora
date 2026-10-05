import type { AuthenticatedUser } from '../../common/auth/types.js'

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

  async createAllocation(_data: Record<string, unknown>, _user: AuthenticatedUser) {
    // TODO: Implement allocation creation with SELECT ... FOR UPDATE capacity lock in Sprint (PIC: Saiful & Jundy)
    return null
  },

  async updateAllocation(_id: string, _data: Record<string, unknown>, _user: AuthenticatedUser) {
    // TODO: Implement allocation update with concurrency protection in Sprint (PIC: Saiful & Jundy)
    return null
  },

  async endAllocation(id: string, _data: Record<string, unknown>, _user: AuthenticatedUser) {
    // TODO: Implement ending an allocation in Sprint (PIC: Saiful & Jundy)
    return { id }
  },

  async cancelAllocation(_id: string, _user: AuthenticatedUser) {
    // TODO: Implement allocation cancellation in Sprint (PIC: Saiful & Jundy)
  },
}
