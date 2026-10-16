import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

export const requestIdMiddleware: RequestHandler = (req, res, next) => {
  const headerVal = req.headers["x-request-id"];
  const existingId = typeof headerVal === "string" ? headerVal : undefined;
  const id = existingId || randomUUID();
  (req as unknown as { id: string }).id = id;
  res.setHeader("X-Request-Id", id);
  next();
};
