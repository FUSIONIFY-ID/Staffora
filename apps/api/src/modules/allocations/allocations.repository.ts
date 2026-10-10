import { prisma } from '../../common/database/prisma.js'

export const allocationsRepository = {
  // Database helper methods for allocations module
  // TODO: Saiful & Jundy can expand custom Prisma queries here during Sprint development
  async findById(id: string) {
    return prisma.allocation.findUnique({
      where: { id },
      include: {
        project: true,
      },
    })
  },
}
