import type { ErrorRequestHandler } from 'express'
import { AppError } from './app-error.js'
import { logger } from '../logging/logger.js'

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const requestId = (req.headers['x-request-id'] as string) || (req as unknown as { id?: string }).id || 'req-unknown'

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, requestId }, err.message)
    } else {
      logger.warn({ err, requestId, code: err.code }, err.message)
    }

    res.status(err.statusCode).json({
      message: err.message,
      code: err.code,
      errors: err.errors,
      meta: err.meta,
      requestId,
    })
    return
  }

  // Handle generic / unexpected error
  logger.error({ err, requestId }, 'Unhandled exception occurred')
  res.status(500).json({
    message: 'An unexpected internal server error occurred.',
    code: 'INTERNAL_SERVER_ERROR',
    errors: {},
    meta: {},
    requestId,
  })
}
