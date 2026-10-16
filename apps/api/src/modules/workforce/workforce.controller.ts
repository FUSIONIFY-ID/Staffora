import type { Request, Response, NextFunction } from "express";
import { getParam } from "../../common/http/params.js";
import { assertAuth } from "../../common/auth/policy.js";
import { sendSuccess, sendList } from "../../common/http/response.js";
import { workforceService } from "./workforce.service.js";
import { workforcePolicy } from "./workforce.policy.js";

export const workforceController = {
  async getDepartments(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> {
    try {
      const items = await workforceService.getDepartments();
      return sendSuccess(res, items);
    } catch (err) {
      next(err);
    }
  },

  async createDepartment(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> {
    try {
      const item = await workforceService.createDepartment(req.body);
      return res.status(201).json({ data: item });
    } catch (err) {
      next(err);
    }
  },

  async getJobRoles(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> {
    try {
      const departmentId =
        typeof req.query.departmentId === "string"
          ? req.query.departmentId
          : undefined;
      const items = await workforceService.getJobRoles(departmentId);
      return sendSuccess(res, items);
    } catch (err) {
      next(err);
    }
  },

  async createJobRole(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> {
    try {
      const item = await workforceService.createJobRole(req.body);
      return res.status(201).json({ data: item });
    } catch (err) {
      next(err);
    }
  },

  async getEmployees(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> {
    try {
      const result = await workforceService.getEmployees(req.query);
      return sendList(res, result.data, {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
      });
    } catch (err) {
      next(err);
    }
  },

  async createEmployee(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> {
    try {
      const item = await workforceService.createEmployee(req.body);
      return res.status(201).json({ data: item });
    } catch (err) {
      next(err);
    }
  },

  async getEmployeeDetail(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> {
    try {
      const employeeId = getParam(req.params.id);
      assertAuth(req.user);
      workforcePolicy.assertCanViewEmployee(req.user, employeeId);
      const item = await workforceService.getEmployeeDetail(employeeId);
      return sendSuccess(res, item);
    } catch (err) {
      next(err);
    }
  },

  async updateEmployee(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> {
    try {
      const employeeId = getParam(req.params.id);
      const item = await workforceService.updateEmployee(employeeId, req.body);
      return sendSuccess(res, item);
    } catch (err) {
      next(err);
    }
  },
};
