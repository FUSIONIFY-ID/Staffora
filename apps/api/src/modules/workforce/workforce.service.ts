import { NotImplementedError } from "../../common/errors/app-error.js";

export const workforceService = {
  async getDepartments(): Promise<unknown[]> {
    throw new NotImplementedError(
      "Departments query is not implemented in Sprint 1.",
    );
  },

  async createDepartment(_data: Record<string, unknown>): Promise<unknown> {
    throw new NotImplementedError(
      "Department creation is not implemented in Sprint 1.",
    );
  },

  async getJobRoles(_departmentId?: string): Promise<unknown[]> {
    throw new NotImplementedError(
      "Job roles query is not implemented in Sprint 1.",
    );
  },

  async createJobRole(_data: Record<string, unknown>): Promise<unknown> {
    throw new NotImplementedError(
      "Job role creation is not implemented in Sprint 1.",
    );
  },

  async getEmployees(
    _query: Record<string, unknown>,
  ): Promise<{
    data: unknown[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    throw new NotImplementedError(
      "Employees listing is not implemented in Sprint 1.",
    );
  },

  async createEmployee(_data: Record<string, unknown>): Promise<unknown> {
    throw new NotImplementedError(
      "Employee creation is not implemented in Sprint 1.",
    );
  },

  async getEmployeeDetail(_id: string): Promise<unknown> {
    throw new NotImplementedError(
      "Employee detail is not implemented in Sprint 1.",
    );
  },

  async updateEmployee(
    _id: string,
    _data: Record<string, unknown>,
  ): Promise<unknown> {
    throw new NotImplementedError(
      "Employee update is not implemented in Sprint 1.",
    );
  },
};
