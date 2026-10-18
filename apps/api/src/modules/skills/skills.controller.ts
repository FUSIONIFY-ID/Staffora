import type { Request, Response, NextFunction } from "express";
import { getParam } from "../../common/http/params.js";
import { sendSuccess } from "../../common/http/response.js";
import { skillsService } from "./skills.service.js";

export const skillsController = {
  async getSkills(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> {
    try {
      const items = await skillsService.getSkills();
      return sendSuccess(res, items);
    } catch (err) {
      next(err);
    }
  },

  async createSkill(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> {
    try {
      const item = await skillsService.createSkill(req.body);
      return res.status(201).json({ data: item });
    } catch (err) {
      next(err);
    }
  },

  async updateSkill(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> {
    try {
      const skillId = getParam(req.params.id);
      const item = await skillsService.updateSkill(skillId, req.body);
      return sendSuccess(res, item);
    } catch (err) {
      next(err);
    }
  },

  async getEmployeeSkills(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> {
    try {
      const employeeId = getParam(req.params.id);
      const items = await skillsService.getEmployeeSkills(employeeId);
      return sendSuccess(res, items);
    } catch (err) {
      next(err);
    }
  },

  async assignSkill(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> {
    try {
      const employeeId = getParam(req.params.id);
      const item = await skillsService.assignSkill(employeeId, req.body);
      return res.status(201).json({ data: item });
    } catch (err) {
      next(err);
    }
  },

  async updateProficiency(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> {
    try {
      const employeeId = getParam(req.params.id);
      const skillId = getParam(req.params.skillId);
      const item = await skillsService.updateProficiency(
        employeeId,
        skillId,
        req.body,
      );
      return sendSuccess(res, item);
    } catch (err) {
      next(err);
    }
  },

  async removeSkill(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> {
    try {
      const employeeId = getParam(req.params.id);
      const skillId = getParam(req.params.skillId);
      await skillsService.removeSkill(employeeId, skillId);
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  async upsertEmployeeSkills(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> {
    try {
      const employeeId = getParam(req.params.id);
      const items = await skillsService.upsertEmployeeSkills(
        employeeId,
        req.body,
      );
      return sendSuccess(res, items);
    } catch (err) {
      next(err);
    }
  },
};
