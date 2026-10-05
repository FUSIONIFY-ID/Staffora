import { prisma } from '../../common/database/prisma.js'

export const skillsRepository = {
  findAll() {
    return prisma.skill.findMany({
      orderBy: { name: 'asc' },
    })
  },

  findByName(name: string) {
    return prisma.skill.findFirst({
      where: {
        name: { equals: name.trim(), mode: 'insensitive' },
      },
    })
  },

  findById(id: string) {
    return prisma.skill.findUnique({
      where: { id },
    })
  },

  create(name: string, actorId?: string) {
    return prisma.skill.create({
      data: {
        name: name.trim(),
        createdBy: actorId,
      },
    })
  },

  updateStatus(id: string, isActive: boolean, actorId?: string) {
    return prisma.skill.update({
      where: { id },
      data: { isActive, updatedBy: actorId },
    })
  },

  findEmployeeSkills(employeeId: string) {
    return prisma.employeeSkill.findMany({
      where: { employeeId },
      include: { skill: true },
      orderBy: { skill: { name: 'asc' } },
    })
  },

  findEmployeeSkill(employeeId: string, skillId: string) {
    return prisma.employeeSkill.findUnique({
      where: {
        employeeId_skillId: { employeeId, skillId },
      },
      include: { skill: true },
    })
  },

  assignSkill(employeeId: string, skillId: string, proficiencyLevel: number, actorId?: string) {
    return prisma.employeeSkill.create({
      data: {
        employeeId,
        skillId,
        proficiencyLevel,
        createdBy: actorId,
      },
      include: { skill: true },
    })
  },

  updateProficiency(employeeId: string, skillId: string, proficiencyLevel: number, actorId?: string) {
    return prisma.employeeSkill.update({
      where: {
        employeeId_skillId: { employeeId, skillId },
      },
      data: {
        proficiencyLevel,
        updatedBy: actorId,
      },
      include: { skill: true },
    })
  },

  removeSkill(employeeId: string, skillId: string) {
    return prisma.employeeSkill.delete({
      where: {
        employeeId_skillId: { employeeId, skillId },
      },
    })
  },
}
