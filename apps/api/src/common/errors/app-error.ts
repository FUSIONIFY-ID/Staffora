export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly errors: Record<string, string[]>
  public readonly meta: Record<string, unknown>

  constructor(
    message: string,
    statusCode = 500,
    code = 'INTERNAL_SERVER_ERROR',
    errors: Record<string, string[]> = {},
    meta: Record<string, unknown> = {},
  ) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.code = code
    this.errors = errors
    this.meta = meta
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed.', errors: Record<string, string[]> = {}) {
    super(message, 422, 'UNPROCESSABLE_ENTITY', errors)
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request.', code = 'BAD_REQUEST', errors: Record<string, string[]> = {}) {
    super(message, 400, code, errors)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required.') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden.') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found.') {
    super(message, 404, 'NOT_FOUND')
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict.', code = 'CONFLICT', meta: Record<string, unknown> = {}) {
    super(message, 409, code, {}, meta)
  }
}

export class CapacityConflictError extends AppError {
  constructor(
    meta: {
      peakAllocation: number
      requestedAllocation: number
      remainingCapacity: number
      conflictStartDate: string
      conflictEndDate: string
    },
    message = 'Allocation exceeds employee capacity.',
  ) {
    super(message, 409, 'CAPACITY_CONFLICT', {}, meta)
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded.') {
    super(message, 429, 'RATE_LIMITED')
  }
}
