import type { Request, Response, NextFunction } from "express";
import { getParam } from "../../common/http/params.js";
import { assertAuth } from "../../common/auth/policy.js";
import {
  sendSuccess,
  sendList,
  sendCreated,
} from "../../common/http/response.js";
import { projectsService } from "./projects.service.js";
import type {
  CreateProjectInput,
  QueryProjectsInput,
  UpdateProjectInput,
} from "./projects.schema.js";

export const projectsController = {
  async getProjects(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> {
    try {
      assertAuth(req.user);
      const result = await projectsService.getProjects(
        req.query as unknown as QueryProjectsInput,
        req.user,
      );
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
      const project = await projectsService.createProject(
        req.body as CreateProjectInput,
        req.user,
      );
      return sendCreated(res, project);
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
        req.body as UpdateProjectInput,
        req.user,
      );
      return sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  },
};
