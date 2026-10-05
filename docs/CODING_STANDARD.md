# Coding Standard

## Staffora: Project Resource Allocation & Workforce Planning System

**Version:** 1.0.0<br>
**Date:** 2026-10-05  
**Status:** Enforced

---

## Table of Contents

1. [General Principles](#1-general-principles)
2. [TypeScript Standards](#2-typescript-standards)
3. [Backend Standards: Express.js 5 + Node.js 24 + Prisma ORM](#3-backend-standards-expressjs-5--nodejs-24--prisma-orm)
4. [Frontend Standards: React 19 + Vite 8 + TanStack Query](#4-frontend-standards-react-19--vite-8--tanstack-query)
5. [Database Standards: PostgreSQL 18 + Prisma 7](#5-database-standards-postgresql-18--prisma-7)
6. [Capacity Engine & Concurrency Locking](#6-capacity-engine--concurrency-locking)
7. [Authentication, Session, and CSRF Security](#7-authentication-session-and-csrf-security)
8. [Testing Standards](#8-testing-standards)
9. [Git Workflow & Branching](#9-git-workflow--branching)
10. [File and Folder Naming](#10-file-and-folder-naming)
11. [Code Formatting and Quality Gates](#11-code-formatting-and-quality-gates)
12. [Staffora Core Business Rules](#12-staffora-core-business-rules)

---

## 1. General Principles

- Write code for the next engineer.
- Prefer explicit over implicit. No hidden side effects. No magic configurations.
- Each function, file, or module has a single responsibility.
- Comments explain **why**, not **what**.
- No dead code in task branches or `main`.
- No `// @ts-ignore`.
- No `any`.
- **Strict File Limit: No production file exceeds 300 lines. Proactively split files at 250 lines.**
- The source of truth is the approved documentation: PRD, TSD, `docs/api/openapi.yaml`, and `docs/database/erd.md`.
- A feature is not complete unless the backend guarantee exists. Client-side hiding is not authorization.

---

## 2. TypeScript Standards

### 2.1 Compiler Settings

The workspace uses TypeScript strict mode across both `apps/web` and `apps/api`.
Required compiler settings:
- `"strict": true`
- `"noImplicitAny": true`
- `"strictNullChecks": true`
- `"noUnusedLocals": true`
- `"noUnusedParameters": true`

### 2.2 Rules

- No `any`. Use `unknown` and narrow with type guards.
- No unsafe `as` casts. If unavoidable at an external boundary, isolate and validate first.
- No non-null assertions (`!`) in application code.
- All exported functions require explicit return types.
- Use `type` for data shapes and unions; use `interface` only for object contracts.
- Enum-like values MUST be string literal unions or Zod enums, never TypeScript `enum`.
- Use `import type` for type-only imports.
- Zod schemas are the single source of truth for runtime request validation.
- Derive TypeScript types via `z.infer<typeof schema>` wherever a Zod schema exists.
- `apps/web` **DILARANG KERAS** mengimpor kode dari `apps/api/src`. Tipe API dibagikan via OpenAPI contract (`npm run api:types`).

---

## 3. Backend Standards: Express.js 5 + Node.js 24 + Prisma ORM

### 3.1 Module Structure (TSD 7.2)

Setiap domain module berada di `apps/api/src/modules/<module>/` dengan struktur:

```text
apps/api/src/modules/<module>/
  <module>.routes.ts        # Route definitions & middleware chain
  <module>.controller.ts    # HTTP request unwrapping & response sending
  <module>.service.ts       # Domain business logic & validation rules
  <module>.repository.ts    # Prisma access (sole layer touching database)
  <module>.schema.ts        # Zod validation schemas
  <module>.policy.ts        # Authorization & ownership checks
  <module>.types.ts         # Internal module types
```

### 3.2 Controller Pattern

Controllers:
- Read Express `req.params`, `req.query`, and `req.body`.
- Input validation is handled by Zod middleware prior to controller execution.
- Call application service functions.
- Send standardized HTTP responses (`sendSuccess`, `sendCreated`, `sendList`, `sendNoContent`).
- **Dilarang** memuat query Prisma langsung atau perhitungan kalkulasi kapasitas di controller.

### 3.3 Service Pattern

Services:
- Accept strongly-typed inputs.
- Own business rules, use cases, and transaction boundaries.
- Call repositories for data persistence.
- Cross-module communication calls public service interfaces, NOT repositories of other modules.
- Throw structured domain errors (`AppError`, `NotFoundError`, `ConflictError`, `CapacityConflictError`).
- Never accept Express `Request` or `Response` objects.

### 3.4 Repository Pattern

Repositories:
- Are the ONLY layer permitted to invoke Prisma Client.
- Accept optional transaction client parameter (`Prisma.TransactionClient`).
- Return typed Prisma models or DTOs.
- Never call services or perform authorization checks.

### 3.5 API Envelopes (TSD 11.4 & 11.5)

Single Resource Response:
```json
{ "data": { ... } }
```

List Response:
```json
{
  "data": [ ... ],
  "meta": { "page": 1, "pageSize": 20, "total": 42, "totalPages": 3 }
}
```

Standard Error Response:
```json
{
  "message": "Human-readable summary.",
  "code": "STABLE_ERROR_CODE",
  "errors": { "fieldName": ["Field error message."] },
  "meta": {},
  "requestId": "uuid"
}
```

---

## 4. Frontend Standards: React 19 + Vite 8 + TanStack Query

### 4.1 Feature Structure

Features live under `apps/web/src/features/<feature>/`:
- Component views render clean JSX with design system primitives.
- Form management uses **React Hook Form 7 + Zod 4**.
- Server state caching and mutations use **TanStack Query 5**.
- Pure state initializers: avoid calling impure functions (like `Date.now()`) directly in render; use lazy initializer functions `useState(() => ...)`.

### 4.2 Component & UI Rules

- Desktop-first layout optimized for 1440px and usable down to 1280px.
- Use Tailwind CSS 4 design tokens and reusable UI primitives from `apps/web/src/components/ui/`.
- Handle all required UI states:
  - **Loading**: Skeleton or `<Spinner />`.
  - **Empty**: Contextual empty state message.
  - **Error**: `<Alert type="error" />` displaying backend error summary.
  - **Forbidden**: Explicit 403 screen per TSD 6.4, never disguise as empty data.
  - **Success / Mutation**: Immediate optimistic or cache invalidation update.

### 4.3 API Client

All API requests go through `apps/web/src/api/client.ts`:
- Native `fetch` with `credentials: "include"` for session cookies.
- Automated `X-CSRF-Token` header injection on mutation requests (POST, PUT, PATCH, DELETE).
- Centralized 401 handling redirecting to `/login`.

---

## 5. Database Standards: PostgreSQL 18 + Prisma 7

### 5.1 Schema Conventions

- Table names: plural `snake_case` (e.g. `users`, `employees`, `allocations`).
- Column names: `snake_case`.
- Primary keys: UUID v4 (`@default(uuid())`).
- Mutable tables include audit fields: `created_at`, `created_by`, `updated_at`, `updated_by`.
- Point-in-time timestamps: PostgreSQL `timestamptz` (stored in UTC).
- Calendar-only dates: PostgreSQL `date` (format `YYYY-MM-DD`, no timezone conversion).
- Foreign keys MUST prevent orphan records (`onDelete: Restrict`).

### 5.2 Migrations

- All schema modifications use Prisma migrations (`npm run db:migrate`).
- Never alter a shared database manually (`prisma db push` is prohibited in production).
- Production migrations must be additive and backward-compatible.
- Historical records are never hard-deleted: inactive employees and cancelled allocations are preserved for audit integrity.

---

## 6. Capacity Engine & Concurrency Locking

1. **Deterministic Sweep-Line Algorithm (TSD 10.3)**:
   - `CapacityService` (`apps/api/src/modules/capacity/capacity.service.ts`) evaluates all non-cancelled overlapping allocations.
   - Generates `+percentage` event on start date and `-percentage` event on day after end date.
   - Calculates running concurrent workload to determine `peakAllocation` and `remainingCapacity = 100% - peakAllocation`.
2. **Sequential Allocations Rule (TSD 10.3 & BR-G17)**:
   - Sequential allocations that do not overlap concurrently MUST NOT be summed as simultaneous workload.
   - Example: 50% on 1–15 Jan and 50% on 16–31 Jan yields peak **50%**, NOT 100%.
3. **Concurrency Protection (TSD 10.4 & ADR-009)**:
   - Allocation creation/updates MUST run inside a Prisma database transaction:
     1. Lock employee row with `SELECT ... FOR UPDATE`.
     2. Re-read latest committed allocations.
     3. Run `CapacityService.evaluateCapacity`.
     4. Persist allocation only if `total <= 100%`.
     5. Commit or roll back with `CAPACITY_CONFLICT` (HTTP 409).

---

## 7. Authentication, Session, and CSRF Security

1. **Session Handling (TSD 8.1 & ADR-006)**:
   - Session stored in PostgreSQL table `user_sessions` via `connect-pg-simple`.
   - Cookie name: `staffora.sid` (HttpOnly, SameSite=Lax, Path=/).
   - Inactivity timeout: 8 hours. Session ID rotated on successful login.
2. **CSRF Protection (TSD 8.3)**:
   - Synchronizer token stored in session.
   - Frontend reads token via `GET /api/v1/auth/csrf-token` and sends header `X-CSRF-Token` on state-changing requests.
3. **Password Security (TSD 8.2)**:
   - Hashed using bcryptjs with cost factor 12. Minimum length: 12 characters.
   - Generic error messages on login failure to prevent username enumeration.
4. **Data Redaction (TSD 13)**:
   - Logger me-redact: `password`, `passwordHash`, `cookie`, `authorization`, `session`, `csrfToken`.

---

## 8. Testing Standards

- **Backend**: Vitest + Supertest covering routes, services, policies, and transactions.
- **Frontend**: Vitest + React Testing Library covering components, forms, and RBAC visibility.
- **Mandatory Capacity Scenarios (TSD 15.3)**:
  All 15 scenarios in `apps/api/tests/capacity.test.ts` must pass.
- **Coverage Target**: Minimum 80% branch coverage on Capacity and Authorization; minimum 70% line coverage overall.

---

## 9. Git Workflow, Branching & Team Governance

### 9.1 Team Responsibilities
- **Tech Lead**: **Arya Isnaidi** (Arsitektur, approval PR/release, dan final sign-off).
- **QA & DevOps**: **Fikri** (Testing regresi, E2E, Docker, dan CI/CD).
- **Frontend Engineers**: **Wahyu & Nabil** (Web UI, presentation, dan TanStack Query).
- **Backend Engineers**: **Saiful & Jundy** (Express API, Prisma migrations, dan Capacity engine).

### 9.2 Rebase Workflow (Mandatory)
Seluruh branch fitur dibuat dari `dev` menggunakan rebase:
```bash
git checkout dev
git pull --rebase origin dev
git checkout -b [FE/BE/DB/QA]-S<SprintNumber>-[Kode]-subjudultask
```

### 9.3 Branch Naming Standard
- Format: `[FE/BE/DB/QA]-S<SprintNumber>-[Kode]-subjudultask`
- Contoh:
  - `FE-S1-US01-login-screen`
  - `BE-S1-US01-session-auth-endpoints`
  - `DB-S1-US01-user-sessions-schema`
  - `FE-S2-US03-project-list-and-detail`
  - `BE-S2-US03-staffing-requirement-crud`
  - `QA-S1-US01-verify-auth-session-flow`

### 9.4 Commit & Push Safety Gate
- **Dilarang push langsung** ke `dev` atau `main`.
- **Dilarang `git add .` secara buta**: Stage hanya file yang relevan dengan tugas.
- **Wajib rebase ke `dev`** sebelum mengajukan Pull Request.
- **Target PR**: Seluruh PR tugas fitur mengarah ke `dev`. Branch `main` hanya dipromosikan oleh Arya Isnaidi setelah rilis lolos uji QA.

---

## 10. File and Folder Naming

| Item | Convention | Example |
| :--- | :--- | :--- |
| Folders | `kebab-case` | `resource-finder/`, `components/ui/` |
| Backend Module Files | `<domain>.<role>.ts` | `workforce.service.ts`, `projects.routes.ts` |
| Frontend Component Files | `kebab-case.tsx` | `project-detail-page.tsx`, `app-layout.tsx` |
| Test Files | `<name>.test.ts(x)` | `capacity.test.ts`, `auth-ui.test.tsx` |
| Database Models / Tables | plural `snake_case` | `staffing_requirements`, `allocations` |
| JSON API Properties | `camelCase` | `startDate`, `allocationPercentage` |

---

## 11. Code Formatting and Quality Gates

Required local verification gate before commit:
```powershell
npm run lint          # ESLint (0 errors, 0 warnings)
npm run typecheck     # TypeScript strict check (tsc)
npm test              # Vitest test suites
npm run build         # Production Vite & Express builds
```

---

## 12. Staffora Core Business Rules

- **BR-G01**: Each authenticated user has exactly one application role in MVP (`ADMIN`, `PROJECT_MANAGER`, `RESOURCE_MANAGER`, `EMPLOYEE`).
- **BR-G06**: Base capacity for each employee is 100%.
- **BR-G07**: Total concurrent allocation effective on any date must not exceed 100%.
- **BR-G08**: Remaining Capacity = 100% - Peak Concurrent Allocation.
- **BR-G09**: An employee may be assigned to multiple projects provided concurrent allocation <= 100%.
- **BR-G10**: Allocation period must fall within the project period.
- **BR-G11**: Only Active employees can receive new allocations.
- **BR-G12**: Non-cancelled allocations consume capacity only in their effective date range; Cancelled allocations consume 0% capacity.
- **BR-G13**: Completed or Archived projects do not accept new allocations.
- **BR-G14**: Backend capacity calculation is the authoritative validation.
- **BR-G15**: Historical records are never hard-deleted.
- **BR-G16**: Start and end dates are inclusive. Same start and end date is a valid single-day allocation.
- **BR-G18**: Allocation mutations must serialize per employee row to prevent race conditions.
