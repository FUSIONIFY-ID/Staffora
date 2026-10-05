import type { AuthenticatedUser } from '../../common/auth/types.js'

export const staffingService = {
  async getRequirementsForProject(_projectId: string) {
    // TODO: Implement staffing requirements query in Sprint 1/2 (PIC: Saiful & Jundy)
    return []
  },

  async createRequirement(_projectId: string, _data: Record<string, unknown>, _user: AuthenticatedUser) {
    // TODO: Implement staffing requirement creation in Sprint 1/2 (PIC: Saiful & Jundy)
    return null
  },

  async updateRequirement(_id: string, _data: Record<string, unknown>, _user: AuthenticatedUser) {
    // TODO: Implement staffing requirement update in Sprint 1/2 (PIC: Saiful & Jundy)
    return null
  },

  async deleteRequirement(_id: string, _user: AuthenticatedUser) {
    // TODO: Implement staffing requirement deletion in Sprint 1/2 (PIC: Saiful & Jundy)
  },
}
