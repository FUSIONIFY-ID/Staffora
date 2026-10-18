import { z } from "zod";
import { ValidationError } from "../../common/errors/app-error.js";
import {
  employeeDetailQuerySchema,
  queryEmployeesSchema,
} from "./workforce.schema.js";
import type {
  EmployeeDetailQuery,
  EmployeeListQuery,
} from "./workforce.schema.js";

function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "root";
    if (!formatted[key]) {
      formatted[key] = [];
    }
    formatted[key].push(issue.message);
  }
  return formatted;
}

function parseOrThrow<T>(
  schema: z.ZodType<T>,
  value: unknown,
  label: string,
): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ValidationError(
      `Validation failed for ${label}.`,
      formatZodErrors(result.error),
    );
  }
  return result.data;
}

/**
 * Query-parameter parsing for the workforce routes.
 *
 * TEMPORARY. This file exists only because `validateQuery` in
 * common/validation/validate.ts assigns to `req.query`, which Express 5 exposes
 * as getter-only, so a request whose schema parses successfully answers 500.
 *
 * PR #6 (BE-S1-US01-RBAC-Authorization-Foundation) replaces that assignment
 * with `Object.defineProperty(req, 'query', ...)`, verified on that branch. Once
 * PR #6 merges, every route here switches to the shared `validateQuery`
 * middleware, the two `parse*` helpers below are deleted, and this file goes
 * away with them. The schemas are already the shared ones, so the switch is one
 * line per route.
 *
 * `formatZodErrors` below duplicates the private helper in validate.ts. That
 * duplication is deliberate:
 *
 *   - the helper in validate.ts is not exported, so reusing it means editing
 *     that file;
 *   - PR #6 already modifies validate.ts, and PR #10 review round 3 recorded
 *     that adding another edit there would put this card in conflict with a file
 *     another card owns and is actively changing.
 *
 * The reviewer's alternative was to export the helper and rebase. The decision
 * between that and accepting the duplication until PR #6 merges is with the Tech
 * Lead; PR #10 review round 3, finding F14, tracks it. Either way this file is
 * deleted once PR #6 lands, so no copy of the formatter survives.
 *
 * Body and path parameters do not need any of this: `req.body` is writable, and
 * `req.params` is writable inside an `express.Router()`, so those two already
 * use the shared validateBody and validateParams middleware.
 */
export function parseEmployeeListQuery(query: unknown): EmployeeListQuery {
  return parseOrThrow(queryEmployeesSchema, query, "query parameters");
}

export function parseEmployeeDetailQuery(query: unknown): EmployeeDetailQuery {
  return parseOrThrow(employeeDetailQuerySchema, query, "query parameters");
}
