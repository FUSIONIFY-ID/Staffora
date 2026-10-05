import { prisma } from '../../common/database/prisma.js'

export const staffingRepository = {
  // Database helper methods for staffing module
  // TODO: Saiful & Jundy can expand custom Prisma queries here during Sprint 1/2
  async findById(id: string) {
    return prisma.staffingRequirement.findUnique({
      where: { id },
    })
  },
}
