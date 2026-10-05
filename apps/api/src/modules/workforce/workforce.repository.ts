import { prisma } from '../../common/database/prisma.js'

export const workforceRepository = {
  // Database helper methods for workforce module
  // TODO: Saiful & Jundy can expand custom Prisma queries here during Sprint development
  async findEmployeeById(id: string) {
    return prisma.employee.findUnique({
      where: { id },
    })
  },
}
