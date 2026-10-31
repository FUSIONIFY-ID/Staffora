import { z } from "zod";
import { Prisma } from "../../generated/prisma/client.js";
import { ConflictError } from "./app-error.js";

/** Response code and message for one violated unique constraint. */
export interface UniqueViolationTarget {
  code: string;
  message: string;
}

export type UniqueViolationMap = Readonly<
  Record<string, UniqueViolationTarget>
>;

export function conflictError(target: UniqueViolationTarget): ConflictError {
  return new ConflictError(target.message, target.code);
}

/**
 * Shape of a Prisma P2002 error produced by the `@prisma/adapter-pg` driver
 * adapter. `meta.target` is not populated by that adapter, so the previous
 * mapping always fell back to a generic code. The violated index name is only
 * reachable through the adapter error, at
 * `meta.driverAdapterError.cause.constraint.index`.
 *
 * Verified against the live driver on PostgreSQL 18: an exact department
 * duplicate reports `departments_name_key`, a case variant reports
 * `departments_name_lower_key`, and employee duplicates report
 * `employees_employee_code_key` and `employees_work_email_key`.
 */
export const uniqueViolationMetaSchema = z.object({
  driverAdapterError: z.object({
    cause: z.object({
      constraint: z.object({
        index: z.string(),
      }),
    }),
  }),
});

export function readConstraintIndex(meta: unknown): string | undefined {
  const parsed = uniqueViolationMetaSchema.safeParse(meta);
  return parsed.success
    ? parsed.data.driverAdapterError.cause.constraint.index
    : undefined;
}

/**
 * Turns a Prisma unique-constraint violation into a 409 that names the field.
 *
 * The pre-flight existence checks in the service are not atomic: two concurrent
 * creates with the same code both pass the check and one then violates the
 * constraint. The index name is what identifies which field lost the race, so
 * the response stays specific instead of degrading to a generic conflict.
 *
 * Anything that is not a P2002 is re-thrown unchanged.
 */
export function mapUniqueViolation(
  error: unknown,
  targets: UniqueViolationMap,
  fallback: UniqueViolationTarget,
): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const index = readConstraintIndex(error.meta);
    const target = index === undefined ? undefined : targets[index];
    throw conflictError(target ?? fallback);
  }
  throw error;
}
