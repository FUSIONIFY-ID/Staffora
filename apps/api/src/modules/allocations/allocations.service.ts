import type { AuthenticatedUser } from "../../common/auth/types.js";
import { assertCanManageAllocation } from "./allocations.policy.js";
import {
  NotFoundError,
  NotImplementedError,
} from "../../common/errors/app-error.js";
import { allocationsRepository } from "./allocations.repository.js";
import type {
  CreateAllocationInput,
  UpdateAllocationInput,
  EndAllocationInput,
} from "./allocations.schema.js";

export const allocationsService = {
  async getAllocations(
    _query: Record<string, unknown>,
    _user: AuthenticatedUser,
  ): Promise<{
    data: unknown[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    throw new NotImplementedError(
      "Allocations query is not implemented in Sprint 1.",
    );
  },

  async getAllocationById(
    _id: string,
    _user: AuthenticatedUser,
  ): Promise<unknown> {
    throw new NotImplementedError(
      "Fetching single allocation is not implemented in Sprint 1.",
    );
  },

  async createAllocation(
    data: CreateAllocationInput,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const project = await allocationsRepository.findProjectById(data.projectId);
    if (!project) {
      throw new NotFoundError("Project not found.");
    }

    assertCanManageAllocation(
      user,
      project.projectManagerEmployeeId,
      "Project not found.",
    );

    throw new NotImplementedError(
      "Allocation creation is not implemented in Sprint 1.",
    );
  },

  async updateAllocation(
    id: string,
    _data: UpdateAllocationInput,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const allocation = await allocationsRepository.findById(id);
    if (!allocation) {
      throw new NotFoundError("Allocation not found.");
    }
    assertCanManageAllocation(
      user,
      allocation.project.projectManagerEmployeeId,
      "Allocation not found.",
    );
    throw new NotImplementedError(
      "Allocation update is not implemented in Sprint 1.",
    );
  },

  async endAllocation(
    id: string,
    _data: EndAllocationInput,
    user: AuthenticatedUser,
  ): Promise<unknown> {
    const allocation = await allocationsRepository.findById(id);
    if (!allocation) {
      throw new NotFoundError("Allocation not found.");
    }
    assertCanManageAllocation(
      user,
      allocation.project.projectManagerEmployeeId,
      "Allocation not found.",
    );
    throw new NotImplementedError(
      "Ending allocation is not implemented in Sprint 1.",
    );
  },

  async cancelAllocation(id: string, user: AuthenticatedUser): Promise<void> {
    const allocation = await allocationsRepository.findById(id);
    if (!allocation) {
      throw new NotFoundError("Allocation not found.");
    }
    assertCanManageAllocation(
      user,
      allocation.project.projectManagerEmployeeId,
      "Allocation not found.",
    );
    throw new NotImplementedError(
      "Cancelling allocation is not implemented in Sprint 1.",
    );
  },
};
