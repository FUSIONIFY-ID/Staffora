import type { Request, Response, NextFunction } from "express";
import { getParam } from "../../common/http/params.js";
import { assertAuth } from "../../common/auth/policy.js";
import { sendSuccess, sendList } from "../../common/http/response.js";
import { projectsService } from "./projects.service.js";

export const projectsController = {
  async getProjects(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> {
    try {
      assertAuth(req.user);
      const result = await projectsService.getProjects(req.query, req.user);
      return sendList(res, result.data, {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
      });
    } catch (err) {
      next(err);
    }
  },

  async createProject(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> {
    try {
      assertAuth(req.user);
      const project = await projectsService.createProject(req.body, req.user);
      return res.status(201).json({
        data: project,
        meta: {
          message: "Create project scaffold - Ready for Sprint 1 development",
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async getProjectDetail(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> {
    try {
      const projectId = getParam(req.params.id);
      assertAuth(req.user);
      const project = await projectsService.getProjectDetail(
        projectId,
        req.user,
      );
      return sendSuccess(res, project);
    } catch (err) {
      next(err);
    }
  },

  async updateProject(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> {
    try {
      const projectId = getParam(req.params.id);
      assertAuth(req.user);
      const updated = await projectsService.updateProject(
        projectId,
        req.body,
        req.user,
      );
      return sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  },
};
