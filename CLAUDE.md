# AI Agent Instructions: Staffora

> **Critical:** These rules apply to every task. If context is compacted, re-read this file before
> continuing. Do not mark work complete until the relevant verification has passed. For a normal
> repository change, run all verification gates: `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.

> **Source of truth:** Product scope, user stories, and acceptance criteria live in the approved PRD
> (`Staffora — Product Requirements, User Stories & Acceptance Criteria MVP v1.0`); API contracts in
> `docs/api/openapi.yaml`; architecture, database ERD, and technical rules in `docs/architecture/`
> and `docs/database/`; implementation standards in `docs/CODING_STANDARD.md`; operational runbooks in
> `docs/runbooks/` and `docs/development/`.

## Project Overview

**Staffora** is an internal Project Resource Allocation & Workforce Planning System. The system
provides enterprise visibility into employee skills, availability, workload, project staffing requirements,
and guarantees capacity conflict prevention (preventing employee allocation from exceeding 100% on any date).

| Layer         | Technology                                                                          |
| ------------- | ----------------------------------------------------------------------------------- |
| Runtime       | Node.js 24 LTS with npm Workspaces                                                  |
| Language      | TypeScript with strict compiler settings (ESM in backend)                           |
| Web           | React 19, Vite 8, React Router 7, TanStack Query 5, React Hook Form 7, Zod 4, Tailwind CSS 4 |
| API           | Express.js 5 (Modular Monolith, versioned at `/api/v1`)                             |
| Database & ORM| PostgreSQL 18, Prisma ORM 7 with `@prisma/adapter-pg`, UUID v4 primary keys        |
| Auth & Session| Server-side session (`connect-pg-simple` in PostgreSQL), cookie `staffora.sid`, CSRF synchronizer token, bcryptjs (cost 12) |
| Architecture  | Modular Monolith, deterministic capacity sweep-line calculation, row-level concurrency lock (`SELECT ... FOR UPDATE`) |
| Observability | Pino + `pino-http`, sensitive field redaction, correlation `requestId`             |

## Team and Work Model

Staffora is delivered by an internal engineering team under the leadership of Tech Lead **Arya Isnaidi**.
Because team members are junior developers, strict discipline, precise task scoping, and unwavering adherence to contracts are mandatory.

| Role                   | Team Member(s)   | Scope & Responsibilities |
| ---------------------- | ---------------- | ------------------------ |
| **Tech Lead**          | **Arya Isnaidi** | Architecture, technical decisions (ADR), PR review & approval, release promotion, acceptance sign-off |
| **QA & DevOps**        | **Fikri**       | CI/CD pipelines, Docker environments, regression testing, E2E acceptance verification |
| **Frontend Engineers** | **Wahyu & Nabil** | Web UI, forms, TanStack Query integration, client presentation (Stream A & B) |
| **Backend Engineers**  | **Saiful & Jundy** | Express API endpoints, Prisma schema & migrations, Capacity engine, RBAC (Stream A & B) |

### Strict Operational Guardrails:
1. **Mandatory Pre-Task Analysis & Contract Alignment:** Before creating, scaffolding, or writing ANY code, the AI agent MUST first read and analyze the project contracts. The agent MUST reference and adhere to @CLAUDE.md, @AGENTS.md, and @GEMINI.md, as well as the relevant documentation under `docs/` (PRD, TSD, ERD, OpenAPI, Coding Standards). NEVER start coding blindly without understanding the domain constraints.
2. **Absolute Ban on Agent `git push` (Commit-Only Boundary):** AI agents are **STRICTLY PROHIBITED** from running `git push` under ANY circumstances (to `dev`, `main`, or feature branches). An agent's execution boundary terminates strictly at local `git commit`. Pushing to GitHub remote is an EXCLUSIVE human developer responsibility after manual inspection and review.
3. **No Rogue Development:** Developers and AI agents MUST NOT invent unapproved features, extra endpoints, or bypass PRD/TSD contracts. Work only on assigned user stories (`USxx.xx — ACxx.xx`).
4. **Backend is Authoritative:** Never fake persistence, authorization, or capacity validation in the Web UI.
5. **Pre-Commit Verification Gates:** AI agents may only create a local `git commit` if all 4 quality gates pass: `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. If any check fails, do NOT commit.

## Git Workflow & Branching Discipline

All developers and AI agents MUST strictly use the `rebase` workflow from `dev`:

### 1. Creating a New Branch (Always from `dev` with rebase)
```bash
git checkout dev
git pull --rebase origin dev
git checkout -b <branch-name>
```

### 2. Branch Naming Standard
Every branch MUST strictly follow the pattern:
```text
[FE/BE/DB/QA]-S<SprintNumber>-[Kode]-subjudultask
```

Prefix definitions:
- `FE`: Frontend application work (Wahyu / Nabil)
- `BE`: Backend API / logic work (Saiful / Jundy)
- `DB`: Database schema, Prisma migrations, and seed scripts (Saiful / Jundy / Arya)
- `QA`: Testing, acceptance validation, and DevOps infrastructure (Fikri)

Examples:
- `FE-S1-US01-login-screen`
- `BE-S1-US01-session-auth-endpoints`
- `DB-S1-US01-user-sessions-schema`
- `FE-S2-US03-project-list-and-detail`
- `BE-S2-US03-staffing-requirement-crud`
- `BE-S3-US04-allocation-concurrency-lock`
- `FE-S3-US05-capacity-timeline-view`
- `QA-S1-US01-verify-auth-session-flow`

### 3. Synchronization & Rebase Before PR
Before creating a Pull Request or pushing changes:
```bash
git checkout dev
git pull --rebase origin dev
git checkout <your-branch>
git rebase dev
```
Resolve any conflicts cleanly, re-verify tests, and push your scoped branch.

### 4. Pull Request & Approval
- **Target Branch:** Normal task PRs always target `dev`.
- **Release Promotion:** `main` is protected and strictly promoted by **Arya Isnaidi (Tech Lead)** upon milestone acceptance.
- **Reviewer:** Arya Isnaidi conducts final review against `docs/CODE_REVIEW_CHECKLIST.md`.

## Commit Safety Gate (AI Agents Forbidden from Pushing)

When an AI agent is instructed to make commits or prepare branches:
- **ABSOLUTE BAN ON `git push`:** AI agents are **STRICTLY FORBIDDEN** from running `git push` to ANY remote branch. The agent's work stops immediately after the local `git commit`. After committing, the agent must output the suggested push command for the human developer to run manually after inspection:
  ```bash
  # Manual human execution only:
  git push origin <your-branch>
  ```
- **NO BLIND STAGING:** Do not run `git add .` or `git add -A` blindly. Stage only the files specifically relevant to the assigned task.
- **NEVER COMMIT DIRECTLY TO `dev` OR `main`.** Always work on an assigned feature branch.
- **PRE-COMMIT MANDATORY GATES:** Verify all 4 checks pass before committing:
  ```powershell
  npm run lint
  npm run typecheck
  npm test
  npm run build
  ```
- If any check fails, do NOT commit. Stop, fix the issue, or report to Tech Lead Arya Isnaidi.
- Commit message format:
  ```text
  <type>(<scope>): <subject> [USxx.xx - ACxx.xx]
  ```

## Local Skills and Commands

Before taking implementation, review, debug, or refactor action, align your task with the following workflow:

| Task                                    | Action / Workflow Reference                                          |
| --------------------------------------- | ------------------------------------------------------------------- |
| Start any developer task                | Read PRD User Story & AC, check OpenAPI and ERD specs              |
| Navigate architecture or trace an issue | Check `docs/architecture/overview.md` and relevant ADR               |
| Diagnose a bug                          | Consult `docs/runbooks/troubleshooting.md`                          |
| Build a Web feature                     | Follow `docs/CODING_STANDARD.md` Frontend standards, use UI library |
| Add or change an API endpoint           | Update `docs/api/openapi.yaml` first, generate types with `npm run api:types` |
| Change database schema                  | Update `schema.prisma`, create Prisma migration, update `docs/database/erd.md` |
| Add / modify capacity logic             | Validate against all 15 Mandatory Capacity Scenarios (`tests/capacity.test.ts`) |
| Review a change set                     | Verify against `docs/CODE_REVIEW_CHECKLIST.md`                      |
| Prepare a commit                        | Follow Conventional Commits: `<type>(<scope>): <subject>`           |

## Repository Layout

```text
staffora/
├── apps/
│   ├── web/                     # Frontend SPA (React 19 + Vite 8 + Tailwind CSS 4)
│   │   ├── public/              # Brand assets, logos, icons
│   │   ├── src/
│   │   │   ├── api/             # API client & generated contracts
│   │   │   ├── app/             # Router, layouts, and providers
│   │   │   ├── components/ui/   # Reusable UI component primitives
│   │   │   └── features/        # Feature modules (auth, resources, skills, projects, etc.)
│   │   └── tests/               # Frontend component & route tests
│   └── api/                     # Backend Modular Monolith (Express.js 5 + Prisma 7)
│       ├── prisma/              # Prisma schema, migrations, and seed script
│       ├── src/
│       │   ├── common/          # Auth, database, errors, http, logging, validation
│       │   └── modules/         # Domain modules (workforce, capacity, allocations, etc.)
│       └── tests/               # Backend tests (capacity scenarios, auth, health)
├── docs/                        # Architecture, OpenAPI, ERD, guides, runbooks
├── .github/workflows/           # CI/CD pipelines
├── docker-compose.yml           # Local development infrastructure (db, api, web)
└── package.json                 # Monorepo root scripts & configuration
```

## Architecture Laws

### Boundaries

- API modules live under `apps/api/src/modules/<module>/`.
- Each domain module follows the standard pattern:
  ```text
  routes.ts        # HTTP endpoints & middleware chain
  controller.ts    # Request parsing & HTTP response formatting
  service.ts       # Use cases & business logic
  repository.ts    # Prisma access (sole layer touching database)
  schema.ts        # Zod validation schemas
  policy.ts        # Authorization & ownership checks
  types.ts         # Internal module types
  ```
- Web features live under `apps/web/src/features/<feature>/`.
- `apps/web` **MUST NOT** import any file from `apps/api/src`.
- Handlers/Controllers validate input via Zod and call application services. Controllers do NOT contain direct database queries or capacity calculations.
- Modules communicate via public service interfaces, not by reaching into another module's repository.
- `CapacityService` (`apps/api/src/modules/capacity/capacity.service.ts`) is the **sole source of truth** for workload and capacity calculations across the system.
- Allocation mutations MUST serialize per employee row using `SELECT ... FOR UPDATE` inside a database transaction (TSD 10.4).

### Scope and Domain Rules

- Business UI copy is clean Bahasa Indonesia / English as specified in PRD. Code identifiers, error codes, database tables/columns, and API fields are English.
- The 4 application roles are: `ADMIN`, `PROJECT_MANAGER`, `RESOURCE_MANAGER`, `EMPLOYEE`.
- Product behavior must strictly match PRD acceptance criteria. Do not invent external microservices, queues, Redis, or AI matching scores (prohibited in MVP per ADR-010).
- Historical records are never hard-deleted: inactive employees, archived projects, and cancelled allocations remain visible in audit history.

### Code Quality

- **File size limit:** Keep production files under 300 lines; split proactively at 250 lines.
- **Strict TypeScript:** No `any`, no `// @ts-ignore`, no non-null assertions (`!`), no unsafe casts.
- Exported functions require explicit return types.
- Prefer `unknown` with narrowing. Zod schemas are the runtime validation source of truth.
- Enum-like values are string literal unions or Zod enums, never TypeScript `enum`.
- Do not read `process.env` inside feature modules. Use centralized configuration (`apps/api/src/config/env.ts`).
- No dead code, unused imports, console.log statements, or plaintext credentials in committed code.

## Database, Storage, and Security

- Change database schemas through committed Prisma migrations only. Never alter database schema manually.
- Passwords MUST be hashed using bcryptjs with cost factor 12.
- Session IDs MUST be stored server-side in PostgreSQL (`user_sessions` table via `connect-pg-simple`) with cookie name `staffora.sid`.
- State-changing HTTP requests (POST, PUT, PATCH, DELETE) MUST validate the CSRF synchronizer token from `GET /api/v1/auth/csrf-token`.
- Never log passwords, password hashes, session cookies, authorization headers, or CSRF tokens.

## Testing and Verification

Run the full quality gate before requesting review or declaring a task complete:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

Specific test targets:
- Backend tests: `npm test -w @staffora/api`
- Frontend tests: `npm test -w @staffora/web`
- Capacity test suite: `npx vitest run tests/capacity.test.ts` (all 15 mandatory scenarios must pass)

## Local Commands

```powershell
# Dependencies & Infrastructure
npm install
docker compose up -d db

# Database Operations
npm run db:migrate -w @staffora/api
npm run db:seed -w @staffora/api

# Development Servers
npm run dev           # Concurrently runs web & api
npm run dev:api       # Express API on http://localhost:3000
npm run dev:web       # Vite SPA on http://localhost:5173

# Quality Gates
npm run lint          # ESLint across all workspaces
npm run typecheck     # TypeScript strict check across all workspaces
npm test              # Vitest test suites
npm run build         # Production builds for web and api

# OpenAPI Types
npm run api:types     # Generate TypeScript API types from openapi.yaml
```

## Context Recovery Checklist

If context is compacted, re-confirm:

- [ ] This is **Staffora**, an internal Project Resource Allocation & Workforce Planning System.
- [ ] Team: **Arya Isnaidi (Tech Lead)**, **Fikri (QA & DevOps)**, **Wahyu & Nabil (FE)**, **Saiful & Jundy (BE)**.
- [ ] Branching workflow: `git checkout dev` -> `git pull --rebase origin dev` -> `git checkout -b [FE/BE/DB/QA]-S<N>-[Kode]-subjudultask`.
- [ ] AI agent safety gate: DO NOT spontaneously commit or push without explicit verification and confirmation.
- [ ] Target integration branch is `dev`; `main` is protected and promoted only by Arya Isnaidi.
- [ ] File size limit: no production file exceeds 300 lines (split at 250 lines).
- [ ] Strict TypeScript: no `any`, no `@ts-ignore`, explicit return types.
- [ ] Capacity calculation is deterministic sweep-line; total concurrent allocation must never exceed 100%.
- [ ] Allocation mutations require transaction with `SELECT ... FOR UPDATE` row lock.
- [ ] Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` before claiming completion.
