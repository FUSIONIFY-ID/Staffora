import { z } from 'zod'
import { ValidationError } from '../../common/errors/app-error.js'
import { employeeDetailQuerySchema, queryEmployeesSchema } from './workforce.schema.js'
import type { EmployeeDetailQuery, EmployeeListQuery } from './workforce.schema.js'

function formatZodErrors(error: z.ZodError): Record<string, string[]> {
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

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, label: string): T {
  const result = schema.safeParse(value)
  if (!result.success) {
    throw new ValidationError(`Validation failed for ${label}.`, formatZodErrors(result.error))
  }
  return result.data
}

/**
 * Query-parameter parsing for the workforce routes.
 *
 * The shared `validateQuery` middleware in common/validation/validate.ts
 * assigns to `req.query`, which Express 5 exposes as a getter-only property, so
 * a request whose schema parses successfully fails with a 500. PR #6 fixes that
 * with Object.defineProperty. Until it lands, the module parses its query
 * strings here and never writes back to the request object. The schemas are the
 * ones the middleware will use, so switching over is a one-line change per
 * route.
 *
 * Body and path parameters do not need this: `req.body` is writable, and
 * `req.params` is writable inside an `express.Router()`, so those two use the
 * shared validateBody and validateParams middleware.
 */
export function parseEmployeeListQuery(query: unknown): EmployeeListQuery {
  return parseOrThrow(queryEmployeesSchema, query, 'query parameters')
}

export function parseEmployeeDetailQuery(query: unknown): EmployeeDetailQuery {
  return parseOrThrow(employeeDetailQuerySchema, query, 'query parameters')
}
