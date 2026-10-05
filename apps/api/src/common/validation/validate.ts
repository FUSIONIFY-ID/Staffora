import type { RequestHandler } from 'express'
import { type ZodType, ZodError } from 'zod'
import { ValidationError } from '../errors/app-error.js'

function formatZodErrors(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'root'
    if (!formatted[key]) {
      formatted[key] = []
    }
    formatted[key].push(issue.message)
  }
  return formatted
}

export function validateBody(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return next(new ValidationError('Validation failed for request body.', formatZodErrors(result.error)))
    }
    req.body = result.data
    next()
  }
}

export function validateQuery(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.query)
    if (!result.success) {
      return next(new ValidationError('Validation failed for query parameters.', formatZodErrors(result.error)))
    }
    req.query = result.data as unknown as Record<string, string>
    next()
  }
}

export function validateParams(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.params)
    if (!result.success) {
      return next(new ValidationError('Validation failed for path parameters.', formatZodErrors(result.error)))
    }
    req.params = result.data as unknown as Record<string, string>
    next()
  }
}
