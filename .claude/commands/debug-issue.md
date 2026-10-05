---
name: Debug Issue
description: Systematically diagnose a Staffora issue with focused code navigation and evidence
---

# Debug Issue

Diagnose issues methodically. Treat the reported behavior as evidence to investigate, not proof of
the assumed cause. Do not implement a fix unless the task explicitly asks for one.

## Before You Start

1. Read `CLAUDE.md` and the relevant Staffora documentation.
2. Capture the environment, Task ID/module, user role, exact error message/status code, reproduction steps, and
   expected behavior.
3. Check `docs/runbooks/troubleshooting.md` for an existing diagnosis before exploring the code.
4. Redact credentials, session cookies, database connection strings, and private tokens from all evidence.

## Investigation Steps

1. Start from the symptom using `rg` to locate the route, component, error message, Zod schema, or Prisma model.
2. Trace the request path through the applicable boundary:
   - Web: `apps/web/src/features/` (UI Component -> React Hook -> API Client -> Shared Schema).
   - API: `apps/api/src/modules/` (Route -> Middleware -> Handler -> Service -> Prisma Repository).
   - Capacity Engine: `apps/api/src/modules/capacity/` (Capacity calculation, concurrency locks via `SELECT ... FOR UPDATE`).
   - Shared Contracts: `packages/shared-schema/src/` (Zod validation schemas, error envelopes).
   - Database: `apps/api/prisma/schema.prisma` and PostgreSQL 18 container logs (`docker compose logs api-db`).
3. Read the relevant API contract (`docs/api/openapi.yaml`) and database schema (`docs/database/erd.md`) before judging behavior.
4. Inspect recent changes with `git status`, `git log`, and focused `git diff` for the suspected files.
5. Identify the impact radius: direct callers, shared schemas, migrations, capacity invariants, Web API clients, and tests.
6. Reproduce using the smallest safe command or test:
   - API unit/integration tests: `npm test --workspace=api`
   - DB integration tests: `npm run test:db --workspace=api`
   - Web component tests: `npm test --workspace=web`
   If an external dependency (like local Postgres) is unavailable, report the result as **Blocked**, not **Pass**.

## Optional Knowledge-Graph Tools

Use graph tooling only when `code-review-graph` is actually connected in the active environment.
Start with `get_minimal_context(task="<task>")`, request `detail_level="minimal"`, and expand only when the
minimal result is insufficient.

Suggested order:
1. `semantic_search_nodes` for the route, component, error code, or domain term.
2. `query_graph` with callers/callees for the suspected function.
3. `get_flow` for the end-to-end execution path.
4. `detect_changes` for likely regressions.
5. `get_impact_radius` before proposing a fix.

Without graph tooling, use the repository layout and focused `rg` searches above; never claim graph
evidence that was not obtained.

## Report Format

Return a concise, evidence-backed report:

1. **Status:** Confirmed, Not Reproduced, or Blocked.
2. **Observed Behavior:** Exact symptom, HTTP status code, and environment.
3. **Root Cause:** Confirmed cause, or the most likely hypothesis clearly labeled as such.
4. **Evidence:** Relevant file paths, line numbers, commands, logs, and failed/passed checks.
5. **Impact:** Affected modules, roles, API envelopes, capacity invariants, and database records.
6. **Next Action:** Smallest safe remediation and verification steps. Do not perform destructive
   migrations or recovery without Tech Lead Arya Isnaidi's approval.

## Efficiency Rules

- Read the smallest useful context first; do not dump whole folders or logs.
- Prefer a few focused searches over broad scans.
- Separate source-code evidence from runtime proof.
- Stop once the cause is confirmed or the next required evidence is clearly identified.
