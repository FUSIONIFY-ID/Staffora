export const workforceService = {
  async getDepartments() {
    // TODO: Implement departments query in Sprint (PIC: Saiful & Jundy)
    return []
  },

  async createDepartment(_data: Record<string, unknown>) {
    // TODO: Implement department creation in Sprint (PIC: Saiful & Jundy)
    return null
  },

  async getJobRoles(_departmentId?: string) {
    // TODO: Implement job roles query in Sprint (PIC: Saiful & Jundy)
    return []
  },

  async createJobRole(_data: Record<string, unknown>) {
    // TODO: Implement job role creation in Sprint (PIC: Saiful & Jundy)
    return null
  },

  async getEmployees(_query: Record<string, unknown>) {
    // TODO: Implement employees listing & filtering in Sprint (PIC: Saiful & Jundy)
    return {
      data: [],
      total: 0,
      page: 1,
      pageSize: 10,
    }
  },

  async createEmployee(_data: Record<string, unknown>) {
    // TODO: Implement employee creation in Sprint (PIC: Saiful & Jundy)
    return null
  },

  async getEmployeeDetail(id: string) {
    // TODO: Implement employee profile detail in Sprint (PIC: Saiful & Jundy)
    return {
      id,
      fullName: 'Employee Foundation Scaffold',
      status: 'ACTIVE',
    }
  },

  async updateEmployee(id: string, _data: Record<string, unknown>) {
    // TODO: Implement employee profile update in Sprint (PIC: Saiful & Jundy)
    return {
      id,
      message: 'Employee updated scaffold',
    }
  },
}
