import { skillsRepository } from './skills.repository.js'
import { ConflictError, NotFoundError, BadRequestError } from '../../common/errors/app-error.js'

export const skillsService = {
  async getSkills() {
    return skillsRepository.findAll()
  },

  async createSkill(name: string, actorId?: string) {
    const existing = await skillsRepository.findByName(name)
    if (existing) {
      throw new ConflictError('A skill with this name already exists.')
    }
    return skillsRepository.create(name, actorId)
  },

  async updateSkillStatus(id: string, isActive: boolean, actorId?: string) {
    const skill = await skillsRepository.findById(id)
    if (!skill) {
      throw new NotFoundError('Skill not found.')
    }
    return skillsRepository.updateStatus(id, isActive, actorId)
  },

  async getEmployeeSkills(employeeId: string) {
    const list = await skillsRepository.findEmployeeSkills(employeeId)
    return list.map((item) => ({
      id: item.id,
      skillId: item.skillId,
      skillName: item.skill.name,
      proficiencyLevel: item.proficiencyLevel,
    }))
  },

  async assignSkill(employeeId: string, skillId: string, proficiencyLevel: number, actorId?: string) {
    const skill = await skillsRepository.findById(skillId)
    if (!skill) {
      throw new NotFoundError('Skill not found.')
    }

    if (!skill.isActive) {
      throw new BadRequestError('Cannot assign an inactive skill.')
    }

    const existingAssignment = await skillsRepository.findEmployeeSkill(employeeId, skillId)
    if (existingAssignment) {
      throw new ConflictError('Skill already assigned to this employee.')
    }

    const item = await skillsRepository.assignSkill(employeeId, skillId, proficiencyLevel, actorId)
    return {
      id: item.id,
      skillId: item.skillId,
      skillName: item.skill.name,
      proficiencyLevel: item.proficiencyLevel,
    }
  },

  async updateProficiency(employeeId: string, skillId: string, proficiencyLevel: number, actorId?: string) {
    const existing = await skillsRepository.findEmployeeSkill(employeeId, skillId)
    if (!existing) {
      throw new NotFoundError('Skill is not assigned to this employee.')
    }

    const item = await skillsRepository.updateProficiency(employeeId, skillId, proficiencyLevel, actorId)
    return {
      id: item.id,
      skillId: item.skillId,
      skillName: item.skill.name,
      proficiencyLevel: item.proficiencyLevel,
    }
  },

  async removeSkill(employeeId: string, skillId: string) {
    const existing = await skillsRepository.findEmployeeSkill(employeeId, skillId)
    if (!existing) {
      throw new NotFoundError('Skill is not assigned to this employee.')
    }
    await skillsRepository.removeSkill(employeeId, skillId)
  },
}
