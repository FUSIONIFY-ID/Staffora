import type { Request, Response, NextFunction } from 'express'
import { sendSuccess } from '../../common/http/response.js'
import { skillsService } from './skills.service.js'

export const skillsController = {
  async getSkills(_req: Request, res: Response, next: NextFunction) {
    try {
      const items = await skillsService.getSkills()
      return sendSuccess(res, items)
    } catch (err) {
      next(err)
    }
  },

  async createSkill(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await skillsService.createSkill(req.body)
      return res.status(201).json({ data: item })
    } catch (err) {
      next(err)
    }
  },

  async updateSkill(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await skillsService.updateSkill(req.params.id as string, req.body)
      return sendSuccess(res, item)
    } catch (err) {
      next(err)
    }
  },

  async getEmployeeSkills(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await skillsService.getEmployeeSkills(req.params.id as string)
      return sendSuccess(res, items)
    } catch (err) {
      next(err)
    }
  },

  async assignSkill(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await skillsService.assignSkill(req.params.id as string, req.body)
      return res.status(201).json({ data: item })
    } catch (err) {
      next(err)
    }
  },

  async updateProficiency(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await skillsService.updateProficiency(req.params.id as string, req.params.skillId as string, req.body)
      return sendSuccess(res, item)
    } catch (err) {
      next(err)
    }
  },

  async removeSkill(req: Request, res: Response, next: NextFunction) {
    try {
      await skillsService.removeSkill(req.params.id as string, req.params.skillId as string)
      return res.status(204).send()
    } catch (err) {
      next(err)
    }
  },

  async upsertEmployeeSkills(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await skillsService.upsertEmployeeSkills(req.params.id as string, req.body)
      return sendSuccess(res, items)
    } catch (err) {
      next(err)
    }
  },
}
