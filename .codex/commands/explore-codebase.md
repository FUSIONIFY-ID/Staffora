---
name: Explore Codebase
description: Navigate and understand Staffora with focused architecture and dependency tracing
---

# Explore Codebase

Explore the codebase from its architecture toward the smallest relevant implementation area. Do not
infer a module, endpoint, or business behavior before checking the authoritative Staffora docs.

## Exploration Steps

1. Read `CLAUDE.md`, then identify the relevant source of truth:
   - Scope & Acceptance Criteria: PRD, TSD, and `docs/TASK_BREAKDOWN.md`.
   - API Contracts & Envelopes: `docs/api/openapi.yaml`.
   - Database Schema & Relationships: `docs/database/erd.md` and `apps/api/prisma/schema.prisma`.
   - Architecture Decisions: `docs/architecture/decisions/` (ADRs).
2. Start with the repository shape using `rg --files`, then narrow to the relevant workspace:
   - Web: `apps/web/src/features/`, `apps/web/src/components/`, `apps/web/src/lib/`.
   - API: `apps/api/src/modules/` (auth, users, departments, skills, projects, staffing, capacity, audit).
   - Shared Contracts: `packages/shared-schema/src/` (Zod schemas, DTOs, API envelopes).
   - Infrastructure & Database: `apps/api/prisma/`, `docker-compose.yml`.
3. Search precise terms with `rg`: route path, HTTP status, Zod schema name, Prisma model, or
   acceptance-criterion ID (`ACxx.xx`).
4. Trace the applicable flow:
   - Web: Component -> Hook -> API client (`fetch` with credentials) -> Zod schema parse -> UI state.
   - API: Express route -> Session auth middleware -> Request validator -> Service -> Prisma repository -> API envelope.
   - Capacity Allocation: Staffing request -> `CapacityService` transaction with row lock (`SELECT ... FOR UPDATE`) -> Allocation record + Audit log.
5. Read existing tests and the nearest comparable implementation before proposing a change:
   - Look for established patterns in `apps/api/src/modules/auth/` or `apps/web/src/features/auth/`.
6. State the observed architecture, entry point, dependency path, and open questions with file-path
   evidence.

## Optional Knowledge-Graph Tools

Use graph tooling only when `code-review-graph` exists in the active environment. Start with
`get_minimal_context(task="<task>")` and `detail_level="minimal"`.

Suggested sequence:
1. `list_graph_stats` and `get_architecture_overview` for a broad map.
2. `list_communities` and `get_community` for the relevant module.
3. `semantic_search_nodes` for a route, function, class, or domain term.
4. `query_graph` with callers, callees, imports, or children patterns.
5. `list_flows` and `get_flow` for full execution paths.

Never report graph findings when no graph tool was available. Use `rg`, focused file reads, and Git
history as the fallback evidence.

## Efficiency Rules

- Start broad only long enough to choose the correct workspace, then narrow.
- Request minimal context/output first and expand only when it changes the decision.
- Read relevant files, not entire folders.
- Adhere to the strict 300-line file limit across all reviewed and newly written files.
- Distinguish implemented Foundation behavior from planned Sprint scope.
