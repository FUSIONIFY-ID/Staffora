import { prisma } from '../../common/database/prisma.js'

export const projectsRepository = {
  // Database helper methods for projects module - Saiful
  async findById(id: string) {
    return prisma.project.findUnique({
      where: { id },
    })
  },

  // TODO: Add update method here - Saiful
  async update(id: string, data: {name?: string; updatedBy?: string}){
    return prisma.project.update({
      where: {id},
      data,
    })
  },
}

