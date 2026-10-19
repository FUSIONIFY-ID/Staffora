import type { ErrorRequestHandler } from "express";
import { AppError, HTTP_STATUS } from "./app-error.js";
import { logger } from "../logging/logger.js";

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const reqIdHeader = req.headers["x-request-id"];
  const requestId =
    (typeof reqIdHeader === "string" ? reqIdHeader : undefined) ||
    (req as unknown as { id?: string }).id ||
    "req-unknown";

  if (err instanceof AppError) {
    if (
      err.statusCode >= HTTP_STATUS.INTERNAL_SERVER_ERROR &&
      err.statusCode !== HTTP_STATUS.NOT_IMPLEMENTED
    ) {
      logger.error({ err, requestId }, err.message);
    } else {
      logger.warn({ err, requestId, code: err.code }, err.message);
    }

    res.status(err.statusCode).json({
      message: err.message,
      code: err.code,
      errors: err.errors,
      meta: err.meta,
      requestId,
    });
    return;
  }

  // Handle generic / unexpected error
  logger.error({ err, requestId }, "Unhandled exception occurred");
  res.status(500).json({
    message: "An unexpected internal server error occurred.",
    code: "INTERNAL_SERVER_ERROR",
    errors: {},
    meta: {},
    requestId,
  });
};
