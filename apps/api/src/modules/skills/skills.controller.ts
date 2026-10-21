import type { Request, Response, NextFunction } from "express";
import {
  sendCreated,
  sendList,
  sendNoContent,
  sendSuccess,
} from "../../common/http/response.js";
import { UnauthorizedError } from "../../common/errors/app-error.js";
import { getParam } from "../../common/http/params.js";
import type { AuthenticatedUser } from "../../common/auth/types.js";
import { skillsService } from "./skills.service.js";
import {
  listEmployeeSkillsQuerySchema,
  listSkillsQuerySchema,
} from "./skills.schema.js";

/**
 * `requireAuth()` on every skills route guarantees an authenticated user. The
 * narrowing lives here so the service can take a non-optional user and keep
 * authorization decisions in skills.policy.ts.
 */
function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  return req.user;
}

/**
 * Body and path parameters arrive already parsed by the `validateBody` and
 * `validateParams` middleware on the route. `validateQuery` replaces
 * `req.query` with the parsed value at runtime, but Express still types it as
 * `ParsedQs`; re-running the schema is the type-safe way to read it back and is
 * a no-op because the schema accepts its own output.
 */
export const skillsController = {
  async getSkills(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await skillsService.listSkills(
        listSkillsQuerySchema.parse(req.query),
      );
      sendList(res, result.data, {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
      });
    } catch (err) {
      next(err);
    }
  },

  async createSkill(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const item = await skillsService.createSkill(
        req.body,
        requireUser(req).id,
      );
      sendCreated(res, item);
    } catch (err) {
      next(err);
    }
  },

  async updateSkill(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const item = await skillsService.updateSkill(
        getParam(req.params.id),
        req.body,
        requireUser(req).id,
      );
      sendSuccess(res, item);
    } catch (err) {
      next(err);
    }
  },

  async getEmployeeSkills(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await skillsService.listEmployeeSkills(
        requireUser(req),
        getParam(req.params.id),
        listEmployeeSkillsQuerySchema.parse(req.query),
      );
      sendList(res, result.data, {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
      });
    } catch (err) {
      next(err);
    }
  },

  async assignSkill(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const item = await skillsService.assignSkill(
        requireUser(req),
        getParam(req.params.id),
        req.body,
      );
      sendCreated(res, item);
    } catch (err) {
      next(err);
    }
  },

  async updateProficiency(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const item = await skillsService.updateProficiency(
        getParam(req.params.id),
        getParam(req.params.skillId),
        req.body,
        requireUser(req).id,
      );
      sendSuccess(res, item);
    } catch (err) {
      next(err);
    }
  },

  async removeEmployeeSkill(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await skillsService.removeEmployeeSkill(
        getParam(req.params.id),
        getParam(req.params.skillId),
      );
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  },
};
