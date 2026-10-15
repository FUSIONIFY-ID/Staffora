import type { Prisma, Project } from "../../generated/prisma/client.js";
import { prisma } from "../../common/database/prisma.js";

export type AllocationWithProject = Prisma.AllocationGetPayload<{
  include: {
    project: true;
  };
}>;

export const allocationsRepository = {
  // Database helper methods for allocations module
  // TODO: Saiful & Jundy can expand custom Prisma queries here during Sprint development
  async findById(id: string): Promise<AllocationWithProject | null> {
    return prisma.allocation.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });
  },

  async findProjectById(id: string): Promise<Project | null> {
    return prisma.project.findUnique({
      where: { id },
    });
  },
};
