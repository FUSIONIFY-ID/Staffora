# Code Review Checklist

## Staffora: Project Resource Allocation & Workforce Planning System

**Version:** 1.0.0<br>
**Date:** 2026-10-05  
**Status:** Enforced

---

Every pull request must satisfy this checklist before merging into `main`. Developers run it as
self-review before requesting PR review. When a rule changes, update this file, [CODING_STANDARD.md](CODING_STANDARD.md),
and the relevant Architecture Decision Record (ADR).

## General

- [ ] PR is scoped to a single task card or user story (`USxx.xx — ACxx.xx`). No unrelated changes bundled in.
- [ ] PR description explains what changed, why, and how to verify it.
- [ ] Task ID, user story, sprint, and AC IDs are explicitly listed.
- [ ] PR references authoritative docs: PRD, TSD, `docs/api/openapi.yaml`, and `docs/database/erd.md`.
- [ ] No commented-out code or unused debug statements (`console.log`).
- [ ] No hardcoded credentials, secrets, local absolute paths, or magic numbers without named constants.
- [ ] Dead imports and unused variables removed.
- [ ] **File Size Limit:** No production file exceeds 300 lines. Files approaching 250 lines are split proactively.
- [ ] No placeholder stubs shipped as complete features.
- [ ] Reusable utilities and components are reused instead of duplicated.
- [ ] Local quality gate passes completely:
  ```powershell
  npm run lint
  npm run typecheck
  npm test
  npm run build
  ```

## TypeScript

- [ ] No `any`. Use `unknown` with narrowing when input type is unknown.
- [ ] No unsafe `as` type casts.
- [ ] No `!` non-null assertions in production application code.
- [ ] All exported functions have explicit return types.
- [ ] Zod schemas are the source of truth for runtime input validation.
- [ ] Types are derived with `z.infer<>` where a Zod schema exists.
- [ ] No `// @ts-ignore`.
- [ ] String literal unions or Zod enums used instead of TypeScript `enum`.
- [ ] `type` for data shapes and unions; `interface` for object contracts.
- [ ] `apps/web` does not import from `apps/api/src`. Shared types come from OpenAPI generated types.

## Backend: Express.js 5 + Node.js 24 + Prisma 7

### Structure & Boundaries

- [ ] Controller contains HTTP translation only: parameter extraction, validation calling, service invocation, response.
- [ ] Business logic and use cases are encapsulated in the service layer.
- [ ] All database queries live in repository modules. No direct Prisma calls from controllers or views.
- [ ] Cross-module dependencies go through public service interfaces, not foreign repositories.
- [ ] No raw `process.env` in feature modules. Centralized configuration in `src/config/env.ts` is used.
- [ ] Module follows standard convention: `routes.ts`, `controller.ts`, `service.ts`, `repository.ts`, `schema.ts`, `policy.ts`, `types.ts`.

### API Design & Semantics

- [ ] Endpoint path matches `docs/api/openapi.yaml` and is versioned at `/api/v1/`.
- [ ] HTTP status codes match TSD 11.3 (`200 OK`, `201 Created`, `204 No Content`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable Entity`, `429 Too Many Requests`, `500 Internal Server Error`).
- [ ] All responses use `{ "data": ... }` or `{ "data": [], "meta": { ... } }`.
- [ ] Error responses follow TSD 11.4: `{ message, code, errors, meta, requestId }`.
- [ ] All external inputs (body, query, params) are validated with Zod before service execution.
- [ ] List endpoints are paginated with `page` (default 1) and `pageSize` (default 20, max 100).
- [ ] OpenAPI spec in `docs/api/openapi.yaml` is updated on any API change.

### Capacity Engine & Concurrency Locking (TSD Section 10)

- [ ] Capacity and availability calculations are routed through `CapacityService` as the single source of truth.
- [ ] Uses deterministic sweep-line algorithm with inclusive boundary rules (TSD 10.2 & 10.3).
- [ ] Sequential allocations that do not run concurrently are NOT added together as simultaneous workload (BR-G17).
- [ ] Allocation creation and updates are wrapped in a Prisma transaction.
- [ ] Concurrency protection locks the employee row with `SELECT ... FOR UPDATE` before re-evaluating capacity (TSD 10.4).
- [ ] If total allocation exceeds 100% on any date, transaction rolls back and returns `CAPACITY_CONFLICT` (HTTP 409) with detailed conflict metadata (`peakAllocation`, `requestedAllocation`, `remainingCapacity`, `conflictStartDate`, `conflictEndDate`).

### Security & RBAC (TSD Section 8 & 13)

- [ ] Authentication uses server-side session in PostgreSQL (`user_sessions` via `connect-pg-simple`).
- [ ] Session cookie uses `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure=true` in staging/production.
- [ ] Session ID is rotated on successful login to prevent session fixation.
- [ ] State-changing endpoints (POST, PUT, PATCH, DELETE) validate the `X-CSRF-Token` header.
- [ ] Authorization policies enforce role checks (`ADMIN`, `PROJECT_MANAGER`, `RESOURCE_MANAGER`, `EMPLOYEE`).
- [ ] Project Managers can only mutate projects and staffing assigned to them (BR-G04).
- [ ] Inactive user accounts are rejected even if holding an old session cookie (AC02.05).
- [ ] Passwords are hashed with bcryptjs at cost factor 12. Minimum length is 12 characters.
- [ ] Sensitive fields are redacted in logs: `password`, `passwordHash`, `cookie`, `authorization`, `session`, `csrfToken`.

## Frontend: React 19 + Vite 8

### Structure & State

- [ ] Features live under `apps/web/src/features/<feature>/`.
- [ ] Views contain JSX and presenter integration only. No raw `fetch` or direct database assumptions.
- [ ] Server state is managed exclusively by **TanStack Query 5**.
- [ ] Form validation uses **React Hook Form 7 + Zod 4**.
- [ ] Local `useState` is reserved for transient component state (modals, active tabs, filters).
- [ ] Date initializers are pure: `useState(() => ...)` instead of calling impure functions directly in render.

### UI Behavior & Design System

- [ ] Layout is desktop-first (optimized for 1440px, fully usable on 1280px).
- [ ] Navigation and action buttons are filtered according to current user role (PRD 2.2 Permission Matrix).
- [ ] Direct navigation to restricted routes renders an explicit 403 Forbidden state with a return link, never disguised as empty data.
- [ ] All data-driven screens handle loading, empty, error, and populated states.
- [ ] Forms provide immediate client-side validation feedback and display backend validation errors.
- [ ] UI uses consistent dark theme (`#0a0f1d`) and brand tokens with Tailwind CSS 4 and shared UI primitives.

## Database & Prisma Migrations

- [ ] All schema modifications are committed via Prisma migrations in `apps/api/prisma/migrations/`.
- [ ] `prisma db push` is never used for production changes.
- [ ] Table names are plural `snake_case`; column names are `snake_case`.
- [ ] Primary keys use UUID v4.
- [ ] Date-only columns use PostgreSQL `date`; timestamps use UTC `timestamptz`.
- [ ] Foreign keys prevent orphaned records (`onDelete: Restrict`).
- [ ] Required indexes match TSD 12.2 (employee code, work email, status/department/role, project dates, allocation dates).
- [ ] Historical records are preserved: deactivation/archival is used instead of hard-deletion.
- [ ] `docs/database/erd.md` and `docs/database/schema.dbml` are updated alongside schema changes.

## Testing & Quality Assurance

- [ ] New business logic has unit tests covering both success and error branches.
- [ ] Mandatory Capacity Scenarios (TSD 15.3, all 15 scenarios) pass in `apps/api/tests/capacity.test.ts`.
- [ ] Supertest API tests verify authentication, session persistence, CSRF validation, and RBAC rules.
- [ ] Frontend unit tests verify login form, role-based navigation, and protected routes.
- [ ] Test coverage meets the baseline: >= 80% branch coverage on Capacity and Authorization; >= 70% line coverage overall.

## Git and PR Hygiene

- [ ] Branch name strictly follows `[FE/BE/DB/QA]-S<SprintNumber>-[Kode]-subjudultask` (e.g. `FE-S1-US01-login-screen`).
- [ ] Branch was rebased on latest `dev` before PR submission (`git rebase dev`). No merge commits.
- [ ] PR targets the `dev` integration branch (never directly to `main`).
- [ ] Commits follow Conventional Commits: `<type>(<scope>): <subject> [USxx.xx - ACxx.xx]`.
- [ ] No local `.env`, build artifacts (`dist/`), temporary logs, or generated secrets are committed.
- [ ] GitHub Actions CI pipeline passes completely on the PR.

## Reviewer Sign-Off

Setiap pull request wajib ditinjau dan disetujui oleh Tech Lead sebelum dimerge ke `dev`:

| Reviewer Role            | Name | Decision                  | Notes / Evidence |
| ------------------------ | ---- | ------------------------- | ---------------- |
| **Tech Lead**            | **Arya Isnaidi** | Approve / Request Changes |                  |
| **QA Verification**      | **Fikri**        | Verified / Blocked        |                  |
