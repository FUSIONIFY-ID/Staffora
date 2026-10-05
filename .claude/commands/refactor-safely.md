---
name: Refactor Safely
description: Plan and execute Staffora refactors with dependency, contract, and test evidence
---

# Refactor Safely

Refactor only with a defined behavior-preservation goal. A refactor must not silently change an API
contract, database schema, authorization policy, capacity lock invariant, or business flow.

## Plan

1. Read `CLAUDE.md`, the relevant `docs/` contract, and the existing tests.
2. Define the refactor boundary, preserved behavior, excluded scope, and success criteria.
3. Inspect direct callers, imports, tests, shared schemas, environment configuration, and affected
   Prisma migrations with focused `rg` searches and file reads.
4. Check `git status` and `git diff` to avoid overwriting unrelated changes.
5. **Enforce the 300-Line Limit:** For large or growing files, proactively split at 250 lines before
   hitting the hard 300-line ceiling, following `docs/CODING_STANDARD.md`. Separate routes, handlers,
   services, repositories, and helper utilities cleanly.

## Execute

1. Make the smallest coherent change set.
2. Keep public API shapes, envelopes (`{ data, meta }`, `{ error }`), and Zod schemas unchanged unless the task explicitly requires contract updates.
3. Preserve server-side authorization and audit logging behavior; UI-only refactors must never bypass backend checks.
4. Preserve Capacity engine transaction safety: never weaken `SELECT ... FOR UPDATE` row locks or concurrency guards.
5. Use forward migrations for Prisma database changes. Never rewrite an already applied migration.
6. Update focused tests and documentation whenever module boundaries, interfaces, or contracts change.

## Verify

1. Re-read the changed files and inspect the focused diff.
2. Verify line count: ensure all modified and created files stay strictly under 300 lines.
3. Run the narrowest relevant tests first:
   - `npm test --workspace=api` or `npm test --workspace=web`
4. Run full repository verification before requesting review:
   - `npm run lint`
   - `npm run typecheck`
   - `npm test`
   - `npm run build`
5. For changed database schemas or queries, run `npm run test:db --workspace=api` against the local Postgres container.
6. Report any unavailable dependency as **Blocked**, not **Pass**.

## Optional Knowledge-Graph Tools

When `code-review-graph` is available, start with `get_minimal_context(task="<task>")` and
`detail_level="minimal"`. Then use:

1. `refactor_tool` in `suggest` or `dead_code` mode for discovery.
2. `refactor_tool` in `rename` mode to preview every affected location.
3. `get_impact_radius`, `get_affected_flows`, and `find_large_functions` before a major change.
4. `apply_refactor_tool` only after reviewing the preview edit list.
5. `detect_changes` after the refactor.

Do not use an automatic refactor tool when its preview is incomplete or when the affected contract
cannot be verified.
