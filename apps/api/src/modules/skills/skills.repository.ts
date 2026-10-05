import { prisma } from '../../common/database/prisma.js'

export const skillsRepository = {
  // Database helper methods for skills module
  // TODO: Saiful & Jundy can expand custom Prisma queries here during Sprint development
  async findById(id: string) {
    return prisma.skill.findUnique({
      where: { id },
    })
  },
}
