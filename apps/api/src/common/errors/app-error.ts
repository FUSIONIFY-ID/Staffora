export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  RATE_LIMITED: 429,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
} as const;

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly errors: Record<string, string[]>;
  public readonly meta: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code = "INTERNAL_SERVER_ERROR",
    errors: Record<string, string[]> = {},
    meta: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    this.meta = meta;
  }
}

export class ValidationError extends AppError {
  constructor(
    message = "Validation failed.",
    errors: Record<string, string[]> = {},
  ) {
    super(
      message,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      "UNPROCESSABLE_ENTITY",
      errors,
    );
  }
}

export class BadRequestError extends AppError {
  constructor(
    message = "Bad request.",
    code = "BAD_REQUEST",
    errors: Record<string, string[]> = {},
  ) {
    super(message, HTTP_STATUS.BAD_REQUEST, code, errors);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required.") {
    super(message, HTTP_STATUS.UNAUTHORIZED, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Access forbidden.") {
    super(message, HTTP_STATUS.FORBIDDEN, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found.") {
    super(message, HTTP_STATUS.NOT_FOUND, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(
    message = "Resource conflict.",
    code = "CONFLICT",
    meta: Record<string, unknown> = {},
  ) {
    super(message, HTTP_STATUS.CONFLICT, code, {}, meta);
  }
}

export class CapacityConflictError extends AppError {
  constructor(
    meta: {
      peakAllocation: number;
      requestedAllocation: number;
      remainingCapacity: number;
      conflictStartDate: string;
      conflictEndDate: string;
    },
    message = "Allocation exceeds employee capacity.",
  ) {
    super(message, HTTP_STATUS.CONFLICT, "CAPACITY_CONFLICT", {}, meta);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Rate limit exceeded.") {
    super(message, HTTP_STATUS.RATE_LIMITED, "RATE_LIMITED");
  }
}

export class NotImplementedError extends AppError {
  constructor(message = "Feature not implemented.") {
    super(message, HTTP_STATUS.NOT_IMPLEMENTED, "NOT_IMPLEMENTED");
  }
}
