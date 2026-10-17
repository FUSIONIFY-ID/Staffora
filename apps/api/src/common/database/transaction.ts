import type { Prisma } from '../../generated/prisma/client.js'
import { prisma } from './prisma.js'

/** Options forwarded to Prisma interactive transactions. */
export interface TransactionOptions {
  maxWait?: number
  timeout?: number
  isolationLevel?: Prisma.TransactionIsolationLevel
}

/**
 * Runs `operation` inside a single database transaction and hands it a scoped
 * `Prisma.TransactionClient`.
 *
 * Every write performed through the provided client commits together when the
 * operation resolves and rolls back together when it throws. Allocation
 * mutations use this boundary together with a `SELECT ... FOR UPDATE` row lock
 * (TSD 10.4, ADR-009); repositories accept the same client via their optional
 * `tx` parameter (CODING_STANDARD 3.4).
 */
export async function withTransaction<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: TransactionOptions,
): Promise<T> {
  return prisma.$transaction(operation, options)
}
