export const skillsService = {
  async getSkills() {
    // TODO: Implement skills query in Sprint (PIC: Saiful & Jundy)
    return []
  },

  async createSkill(_data: Record<string, unknown>) {
    // TODO: Implement skill creation in Sprint (PIC: Saiful & Jundy)
    return null
  },

  async updateSkill(id: string, _data: Record<string, unknown>) {
    // TODO: Implement skill update in Sprint (PIC: Saiful & Jundy)
    return { id }
  },

  async getEmployeeSkills(_employeeId: string) {
    // TODO: Implement employee skills query in Sprint (PIC: Saiful & Jundy)
    return []
  },

  async assignSkill(_employeeId: string, _data: unknown) {
    // TODO: Implement assign skill in Sprint (PIC: Saiful & Jundy)
    return null
  },

  async updateProficiency(_employeeId: string, _skillId: string, _data: unknown) {
    // TODO: Implement update proficiency in Sprint (PIC: Saiful & Jundy)
    return null
  },

  async removeSkill(_employeeId: string, _skillId: string) {
    // TODO: Implement remove skill in Sprint (PIC: Saiful & Jundy)
  },

  async upsertEmployeeSkills(_employeeId: string, _data: unknown) {
    // TODO: Implement employee skills upsert in Sprint (PIC: Saiful & Jundy)
    return []
  },
}
