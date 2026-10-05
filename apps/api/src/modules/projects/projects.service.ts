import type { AuthenticatedUser } from '../../common/auth/types.js'

export const projectsService = {
  async getProjects(_params: Record<string, unknown>, _user: AuthenticatedUser) {
    // TODO: Implement projects query and role filtering in Sprint 1 (PIC: Saiful & Jundy)
    return {
      data: [],
      total: 0,
      page: 1,
      pageSize: 10,
    }
  },

  async createProject(_data: Record<string, unknown>, _user: AuthenticatedUser) {
    // TODO: Implement project creation logic and validations in Sprint 1 (PIC: Saiful & Jundy)
    return null
  },

  async getProjectDetail(id: string, _user: AuthenticatedUser) {
    // TODO: Implement project detail and staffing view in Sprint 1 (PIC: Saiful & Jundy)
    return {
      id,
      name: 'Project Foundation Scaffold',
      status: 'PLANNED',
      staffingRequirements: [],
      allocations: [],
    }
  },

  async updateProject(id: string, _data: Record<string, unknown>, _user: AuthenticatedUser) {
    // TODO: Implement project update in Sprint 1 (PIC: Saiful & Jundy)
    return {
      id,
      message: 'Project updated scaffold',
    }
  },
}
