import type { Project } from "../../generated/prisma/client.js";
import type { AuthenticatedUser } from "../../common/auth/types.js";
import { projectsRepository } from "./projects.repository.js";
import { projectsPolicy } from "./projects.policy.js";
import {
  NotFoundError,
  NotImplementedError,
} from "../../common/errors/app-error.js";

export const projectsService = {
  async getProjects(
    _params: Record<string, unknown>,
    _user: AuthenticatedUser,
  ): Promise<{
    data: unknown[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    throw new NotImplementedError(
      "Projects list is not implemented in Sprint 1.",
    );
  },

  async createProject(
    _data: Record<string, unknown>,
    _user: AuthenticatedUser,
  ): Promise<unknown> {
    throw new NotImplementedError(
      "Project creation is not implemented in Sprint 1.",
    );
  },

  async getProjectDetail(
    id: string,
    _user: AuthenticatedUser,
  ): Promise<Project> {
    const project = await projectsRepository.findById(id);
    if (!project) {
      throw new NotFoundError("Project not found.");
    }
    return project;
  },

  async updateProject(
    id: string,
    data: Record<string, unknown>,
    user: AuthenticatedUser,
  ): Promise<{ id: string; name: string; status: string }> {
    const project = await projectsRepository.findById(id);
    if (!project) {
      throw new NotFoundError("Project not found.");
    }

    projectsPolicy.assertCanUpdate(user, project.projectManagerEmployeeId);

    const updated = await projectsRepository.update(id, {
      ...(typeof data.name === "string" ? { name: data.name } : {}),
      updatedBy: user.id,
    });

    return {
      id: updated.id,
      name: updated.name,
      status: updated.status,
    };
  },
};
