import { NotImplementedError } from "../../common/errors/app-error.js";

export const skillsService = {
  async getSkills(): Promise<unknown[]> {
    throw new NotImplementedError(
      "Skills catalog is not implemented in Sprint 1.",
    );
  },

  async createSkill(_data: Record<string, unknown>): Promise<unknown> {
    throw new NotImplementedError(
      "Skill creation is not implemented in Sprint 1.",
    );
  },

  async updateSkill(
    _id: string,
    _data: Record<string, unknown>,
  ): Promise<unknown> {
    throw new NotImplementedError(
      "Skill update is not implemented in Sprint 1.",
    );
  },

  async getEmployeeSkills(_employeeId: string): Promise<unknown[]> {
    throw new NotImplementedError(
      "Employee skills query is not implemented in Sprint 1.",
    );
  },

  async assignSkill(_employeeId: string, _data: unknown): Promise<unknown> {
    throw new NotImplementedError(
      "Assigning skill to employee is not implemented in Sprint 1.",
    );
  },

  async updateProficiency(
    _employeeId: string,
    _skillId: string,
    _data: unknown,
  ): Promise<unknown> {
    throw new NotImplementedError(
      "Updating skill proficiency is not implemented in Sprint 1.",
    );
  },

  async removeSkill(_employeeId: string, _skillId: string): Promise<void> {
    throw new NotImplementedError(
      "Removing employee skill is not implemented in Sprint 1.",
    );
  },

  async upsertEmployeeSkills(
    _employeeId: string,
    _data: unknown,
  ): Promise<unknown[]> {
    throw new NotImplementedError(
      "Upserting employee skills is not implemented in Sprint 1.",
    );
  },
};
