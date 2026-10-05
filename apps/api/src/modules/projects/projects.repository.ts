import { prisma } from '../../common/database/prisma.js'

export const projectsRepository = {
  // Database helper methods for projects module
  // TODO: Saiful & Jundy can expand custom Prisma queries here during Sprint 1
  async findById(id: string) {
    return prisma.project.findUnique({
      where: { id },
    })
  },
}
