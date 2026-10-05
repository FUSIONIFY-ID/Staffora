# ADR-009: Serialize Allocation Mutation with Employee Row Lock

- **Status**: Accepted
- **Decision Date**: 2026-10-04
- **Technical Decision ID**: TD-009

## Context
A critical business requirement (BR-G07, BR-G18) is that total employee allocation must never exceed 100% on any date. If two Project Managers simultaneously assign the same employee to different projects, optimistic concurrency could read valid capacity concurrently and both commit, causing over-allocation beyond 100%.

## Decision
Execute all allocation create and update mutations inside a single PostgreSQL transaction that begins with an exclusive row lock on the affected employee:
`SELECT id FROM employees WHERE id = $1 FOR UPDATE`.
Under this lock:
1. Fetch all currently committed non-cancelled allocations for the employee intersecting the requested date range.
2. Execute the deterministic Capacity calculation engine.
3. If `PeakConcurrentAllocation + requestedAllocation > 100%`, immediately abort with 409 `CAPACITY_CONFLICT`.
4. Otherwise, persist the new or updated allocation record and commit the transaction.

## Consequences
- Guaranteed mathematical prevention of over-allocation without distributed locking systems.
- Minimal lock duration since transaction only performs fast indexed queries and in-memory calculations before commit.
