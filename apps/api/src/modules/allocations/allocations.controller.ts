import type { Request, Response, NextFunction } from "express";
import { getParam } from "../../common/http/params.js";
import { assertAuth } from "../../common/auth/policy.js";
import {
  sendSuccess,
  sendList,
  sendCreated,
  sendNoContent,
} from "../../common/http/response.js";
import { allocationsService } from "./allocations.service.js";

export const allocationsController = {
  async getAllocations(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> {
    try {
      assertAuth(req.user);
      const result = await allocationsService.getAllocations(
        req.query,
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

  async getAllocationById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> {
    try {
      const allocationId = getParam(req.params.id);
      assertAuth(req.user);
      const item = await allocationsService.getAllocationById(
        allocationId,
        req.user,
      );
      return sendSuccess(res, item);
    } catch (err) {
      next(err);
    }
  },

  async createAllocation(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> {
    try {
      assertAuth(req.user);
      const item = await allocationsService.createAllocation(
        req.body,
        req.user,
      );
      return sendCreated(res, item);
    } catch (err) {
      next(err);
    }
  },

  async updateAllocation(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> {
    try {
      const allocationId = getParam(req.params.id);
      assertAuth(req.user);
      const item = await allocationsService.updateAllocation(
        allocationId,
        req.body,
        req.user,
      );
      return sendSuccess(res, item);
    } catch (err) {
      next(err);
    }
  },

  async endAllocation(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> {
    try {
      const allocationId = getParam(req.params.id);
      assertAuth(req.user);
      const item = await allocationsService.endAllocation(
        allocationId,
        req.body,
        req.user,
      );
      return sendSuccess(res, item);
    } catch (err) {
      next(err);
    }
  },

  async cancelAllocation(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> {
    try {
      const allocationId = getParam(req.params.id);
      assertAuth(req.user);
      await allocationsService.cancelAllocation(allocationId, req.user);
      return sendNoContent(res);
    } catch (err) {
      next(err);
    }
  },
};
