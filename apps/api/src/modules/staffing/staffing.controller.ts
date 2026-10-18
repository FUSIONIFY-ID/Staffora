import type { Request, Response, NextFunction } from "express";
import { getParam } from "../../common/http/params.js";
import { assertAuth } from "../../common/auth/policy.js";
import {
  sendSuccess,
  sendCreated,
  sendNoContent,
} from "../../common/http/response.js";
import { staffingService } from "./staffing.service.js";

export const staffingController = {
  async getRequirementsForProject(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> {
    try {
      const projectId = getParam(req.params.id);
      const items = await staffingService.getRequirementsForProject(projectId);
      return sendSuccess(res, items);
    } catch (err) {
      next(err);
    }
  },

  async createRequirement(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> {
    try {
      const projectId = getParam(req.params.id);
      assertAuth(req.user);
      const item = await staffingService.createRequirement(
        projectId,
        req.body,
        req.user,
      );
      return sendCreated(res, item);
    } catch (err) {
      next(err);
    }
  },

  async updateRequirement(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> {
    try {
      const requirementId = getParam(req.params.id);
      assertAuth(req.user);
      const item = await staffingService.updateRequirement(
        requirementId,
        req.body,
        req.user,
      );
      return sendSuccess(res, item);
    } catch (err) {
      next(err);
    }
  },

  async deleteRequirement(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> {
    try {
      const requirementId = getParam(req.params.id);
      assertAuth(req.user);
      await staffingService.deleteRequirement(requirementId, req.user);
      return sendNoContent(res);
    } catch (err) {
      next(err);
    }
  },
};
