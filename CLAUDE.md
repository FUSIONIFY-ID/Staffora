# AI Agent Instructions: Staffora

> **Critical:** These rules apply to every task. If context is compacted, re-read this file before
> continuing. Do not mark work complete until the relevant verification has passed. For a normal
> repository change, run all verification gates: `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.

> **Source of truth:** Product scope, user stories, and acceptance criteria live in the approved PRD
> (`Staffora — Product Requirements, User Stories & Acceptance Criteria MVP v1.0`); technical baseline in the
> approved TSD (`Staffora — Technical Specification Document MVP v1.0`). The repository documents them
> by ID and section number. Start from `docs/README.md`. Task breakdown lives in `docs/tasks/`.

## Project Overview

**Staffora** is an internal Project Resource Allocation & Workforce Planning System. The system
provides enterprise visibility into employee skills, availability, workload, project staffing requirements,
and guarantees capacity conflict prevention (preventing employee allocation from exceeding 100% on any date).

| Layer          | Technology                                                                                                                  |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Runtime        | Node.js 24 LTS with npm Workspaces                                                                                          |
| Language       | TypeScript with strict compiler settings (ESM in backend)                                                                   |
| Web            | React 19, Vite 8, React Router 7, TanStack Query 5, React Hook Form 7, Zod 4, Tailwind CSS 4                                |
| API            | Express.js 5 (Modular Monolith, versioned at `/api/v1`)                                                                     |
| Database & ORM | PostgreSQL 18, Prisma ORM 7 with `@prisma/adapter-pg`, UUID v4 primary keys                                                 |
| Auth & Session | Server-side session (`connect-pg-simple` in PostgreSQL), cookie `staffora.sid`, CSRF synchronizer token, bcryptjs (cost 12) |
| Architecture   | Modular Monolith, deterministic capacity sweep-line calculation, row-level concurrency lock (`SELECT ... FOR UPDATE`)       |
| Observability  | Pino + `pino-http`, sensitive field redaction, correlation `requestId`                                                      |

## Team and Work Model

Staffora is delivered by an internal engineering team under the leadership of Tech Lead **Arya Isnaidi**.
Because team members are junior developers, strict discipline, precise task scoping, and unwavering adherence to contracts are mandatory.

| Role                   | Team Member(s)     | Scope & Responsibilities                                                                              |
| ---------------------- | ------------------ | ----------------------------------------------------------------------------------------------------- |
| **Tech Lead**          | **Arya Isnaidi**   | Architecture, technical decisions (ADR), PR review & approval, release promotion, acceptance sign-off |
| **QA & DevOps**        | **Fikri**          | CI/CD pipelines, Docker environments, regression testing, E2E acceptance verification                 |
| **Frontend Engineers** | **Wahyu & Nabil**  | Web UI, forms, TanStack Query integration, client presentation (Stream A & B)                         |
| **Backend Engineers**  | **Saiful & Jundy** | Express API endpoints, Prisma schema & migrations, Capacity engine, RBAC (Stream A & B)               |

### Strict Operational Guardrails:

1. **Mandatory Pre-Task Analysis & Contract Alignment:** Before creating, scaffolding, or writing ANY code, the AI agent MUST first read and analyze the project contracts. Read the task file in `docs/tasks/<sprint>/<USxx.xx>.md` (or `docs/tasks/cross-cutting/` for work outside a story), then the PRD story and AC, `docs/api/openapi.yaml`, `docs/database/erd.md`, and `apps/api/prisma/schema.prisma`. The agent MUST reference and adhere to @CLAUDE.md, @AGENTS.md, and @GEMINI.md. NEVER start coding blindly without understanding the domain constraints.
2. **Absolute Ban on Agent `git push` (Commit-Only Boundary):** AI agents are **STRICTLY PROHIBITED** from running `git push` under ANY circumstances (to `dev`, `main`, or feature branches). An agent's execution boundary terminates strictly at local `git commit`. Pushing to GitHub remote is an EXCLUSIVE human developer responsibility after manual inspection and review.
3. **No Rogue Development:** Developers and AI agents MUST NOT invent unapproved features, extra endpoints, or bypass PRD/TSD contracts. Work only on tasks with status `ready` in the task file, and only on paths listed under "Boleh disentuh". Tasks with status `blocked` are not started. A task that does not meet the Definition of Ready in `docs/tasks/README.md` is treated as `blocked`.
4. **Backend is Authoritative:** Never fake persistence, authorization, or capacity validation in the Web UI.
5. **Pre-Commit Verification Gates:** AI agents may only create a local `git commit` if all 4 quality gates pass: `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. If any check fails, do NOT commit.
6. **No Secrets in the Repository:** Never write a password, token, `SESSION_SECRET`, or other credential value in code, documentation, commit messages, or logs. Name the environment variable instead. Credentials that already exist in the repository are tracked in `docs/tasks/cross-cutting/security.md`. Do not add new ones.
7. **Pre-Push Review:** Whenever a developer is about to push (or asks "siap push", "review sebelum push", or similar), the agent runs the **Pre-Push Review** in this file before handing over the push command. The agent still never runs `git push` itself. Blockers found in the review are resolved locally, using the **Blocker Resolution** table, before any push command is given.
8. **Trello Task Alignment:** When working on a Trello card or a task, the agent matches the task to its task file, PRD, TSD, OpenAPI, ERD, and the Figma design (FE) or `docs/ui-specs/` before writing code. Conflicts are reported, not guessed. See **Trello Task Alignment** in this file.

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
- `QA`: Testing, acceptance validation, documentation, and DevOps infrastructure (Fikri)

Examples:

- `FE-S1-US01-login-screen`
- `BE-S1-US01-session-auth-endpoints`
- `DB-S1-US01-user-sessions-schema`
- `FE-S2-US03-project-list-and-detail`
- `BE-S2-US03-staffing-requirement-crud`
- `BE-S3-US04-allocation-concurrency-lock`
- `FE-S3-US05-capacity-timeline-view`
- `QA-S1-US01-verify-auth-session-flow`
- `QA-S1-DOC-docs-restructure` (documentation without a story)

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
- **PR description:** Use `.github/pull_request_template.md`. Tick a checkbox only when the agent or developer has verified it.

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
- **Work without a story:** Use the tag `[QA-S1-DOC]` (documentation) or `[QA-S1-SEC]` (cross-cutting security) in place of `[USxx.xx - ACxx.xx]`. Never invent an AC ID.
- **No AI attribution in commits:** Do NOT add a `Co-Authored-By: Claude ...` trailer or any other AI attribution line to commit messages. Commits are made under the developer's own git identity (`git config user.name`). The repository's `commit-msg` hook in `.githooks/` strips such trailers when the clone has `core.hooksPath` set to `.githooks`, and CI rejects them on pull requests. This rule applies even without the hook.
- **No AI footer in pull requests:** Do not add an AI attribution footer to a PR description unless the developer asks for it.

## Pre-Push Review (mandatory before a developer pushes)

The repository also has a `pre-push` hook (`.githooks/pre-push`). On every push from a clone with `core.hooksPath` set to `.githooks`, it runs the four gates automatically. The hook checks gates only and does not review code, so the steps below still apply when the agent is asked to review.

The agent runs these steps in order, on the local branch, before it hands over any push command. All steps must pass.

1. **Scope.** Run `git status` and `git diff --stat origin/dev...HEAD`. Every changed path must be listed under "Boleh disentuh" in the task file. A path outside the list is a blocker.
2. **Gates.** Run `npm run lint`, `npm run typecheck`, `npm test` (API tests need the temporary database described in Testing and Verification), and `npm run build`. All must exit with 0.
3. **Code review.** Review the diff against `docs/CODE_REVIEW_CHECKLIST.md`. If the `review-changes` skill is available, use it. Record every finding with file:line and a severity: **P0** (blocker, no push), **P1** (must fix before merge), **P2** (suggestion).
4. **Coding standard (mechanical checks on the diff).**
   - Production file above 300 lines: blocker. Above 250 lines: suggest splitting.
   - `any`, `@ts-ignore`, non-null assertion `!`, or an unsafe cast in new code: blocker.
   - Exported function without an explicit return type: blocker.
   - `console.log` in production code: blocker.
   - `process.env` outside `apps/api/src/config/env.ts`: blocker, unless the file already existed and the exception is recorded in the review.
   - TypeScript `enum`: blocker.
   - `apps/web` importing from `apps/api/src`: blocker.
   - Dead code or unused imports: blocker.
   - Secret values (passwords, tokens, `SESSION_SECRET=` with a value): blocker.
   - `Co-Authored-By` or any AI attribution line in commits: blocker.
   - Commit message not in the format above: warning.
5. **Contracts and docs in sync.**
   - Endpoint, field, or HTTP status changed: `docs/api/openapi.yaml` changed in the same diff, and `npm run api:types` was run.
   - Prisma schema changed: a new migration exists, and `docs/database/erd.md` and `docs/database/indexes.md` changed.
   - New error code: `docs/api/error-catalog.md` changed.
   - Route or role guard changed: `docs/security/rbac-matrix.md` changed.
   - Architecture decision: a new ADR with Status `Proposed`.
   - Any mismatch in this step is a blocker.
6. **Verdict.** Write exactly one of these:
   - `BERSIH`: list any P2 suggestions, then give the manual push command for the developer.
   - `ADA BLOCKER`: list the blockers, then follow Blocker Resolution. Do not give a push command.

## Blocker Resolution

The agent resolves blockers itself, as long as the fix stays inside the task scope. After each fix, rerun the whole Pre-Push Review from step 1. At most three rounds. If blockers remain after three rounds, stop and report them.

| Blocker | How to resolve |
| --- | --- |
| Lint, typecheck, or build gate fails | Fix the code, rerun the gate |
| Test fails because of the database | Use a temporary container on another port. See `docs/database/migration-policy.md`, section "Lingkungan uji". Do not change an existing database password |
| A path outside "Boleh disentuh" changed | Revert that path, only if the agent changed it in this session. Never discard the developer's own changes |
| Endpoint changed but OpenAPI did not | Update `docs/api/openapi.yaml` first, run `npm run api:types`, then adjust the code |
| Schema changed without a migration | Create a new migration with `npm run db:migrate -w @staffora/api`. Never edit an existing migration |
| Production file above 300 lines | Split the module. Use the `refactor-large-file` skill if available |
| Secret found in the diff | Remove it from the diff, replace it with a variable name. If the credential already exists in the repository, record it in `docs/tasks/cross-cutting/security.md`. Do not commit |
| Docs out of sync with code | Update the docs in the same diff |
| Contract, PRD, or design conflict | Stop. Report to the developer and Tech Lead. Do not guess |
| Needs access the agent does not have (VM, GitHub, Figma edit) | Stop. Name the access that is needed |

Never, during resolution: `git push --force`, `git reset --hard` over the developer's changes, disabling a test or gate, changing `.gitignore` to hide files, or adding `// @ts-ignore` or `eslint-disable`.

## Trello Task Alignment

Sources of truth, in order:

1. PRD (behavior and AC text)
2. TSD (how to build it)
3. `docs/api/openapi.yaml` and `docs/database/erd.md` (data contracts)
4. Task files in `docs/tasks/` (scope of work)
5. Figma and `docs/ui-specs/` (FE visuals)
6. Trello cards (status and context, not a contract)

Steps when a developer names a Trello card or gives its ID or link:

1. **Read the card.** Use the Trello connector if it is available (`trelloReadCard` or `trelloSearch`). Note the title, the description, and the "Acceptance source" line.
2. **Map it to a task.** Card titles follow `[S<n>][<FE|BE|DB|QA>][<TOPIK>] USxx.xx — <judul>`. Match them to `S<n>-USxx.xx-<PREFIX>-<nn>` in `docs/tasks/sprint-<n>/USxx.xx.md`. If the card scope and the task file differ, stop and ask.
3. **Check the task status.** Only `ready` tasks are worked on. For `blocked` or `done`, report and do not start. Do not decide from the Trello column alone, because it can lag behind (for example, a card still in "Code Review" after its PR was merged).
4. **Find the design and contract.**
   - FE: find the screen in Figma, file "Staffora — Product Design & Prototype (MVP v1.0)", in the frame with a name such as `06 — Skill Management`. Use `docs/ui-specs/design-system/design-system.md` for tokens and states, and `design-system.json` for machine-readable values. If Figma access is not available, ask the developer to export the frame as PNG into `docs/ui-specs/<fitur>/`. Do not guess the look.
   - BE: the OpenAPI paths named in the task, the tables in the ERD, and the module doc in `docs/architecture/modules/`.
   - AC text: read it from the PRD. Never invent it.
5. **Check for conflicts.** If Figma or OpenAPI disagrees with the PRD, the PRD wins for behavior. Report the difference and do not implement yet.
6. **Confirm before writing code.** Write in the chat: the task ID, the AC IDs covered, the paths allowed, and the design and contract being used. Wait for the developer's confirmation if there is a conflict.
7. **Do not change the Trello card** (move the column, comment, change labels) without the developer's approval. Writing to Trello is an action outside the repository.

Preventing FE and BE mistakes:

- FE calls only endpoints that exist in the OpenAPI contract. A new endpoint starts from the contract.
- FE does not import `apps/api/src`, and does not fake data that looks saved.
- Menu and button visibility follows `docs/security/rbac-matrix.md`. The backend remains the authority for authorization.
- BE does not add endpoints, fields, or error codes outside the contract.
- Only the four roles in "Scope and Domain Rules" are used.

## Local Skills and Commands

Before taking implementation, review, debug, or refactor action, align your task with the following workflow:

| Task                                    | Action / Workflow Reference                                                                                              |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Start any developer task                | Read `docs/tasks/<sprint>/<USxx.xx>.md`, then PRD story & AC, OpenAPI, and ERD                                           |
| Work on a Trello card                   | Follow Trello Task Alignment                                                                                             |
| Navigate architecture or trace an issue | `docs/architecture/overview.md`, the module doc in `docs/architecture/modules/`, and the relevant ADR                     |
| Diagnose a bug                          | `docs/runbooks/troubleshooting.md`, then `docs/api/error-catalog.md` for the error code                                  |
| Build a Web feature                     | `docs/CODING_STANDARD.md` (Frontend standards), `docs/ui-specs/` for the design system                                   |
| Add or change an API endpoint           | Update `docs/api/openapi.yaml` first, generate types with `npm run api:types`, and update `docs/api/error-catalog.md` for new error codes |
| Change database schema                  | Update `schema.prisma`, create Prisma migration, update `docs/database/erd.md` and `docs/database/indexes.md`. See `docs/database/migration-policy.md` |
| Change authorization                    | Update `docs/security/rbac-matrix.md` in the same PR                                                                     |
| Add / modify capacity logic             | Validate against all 15 Mandatory Capacity Scenarios (`apps/api/tests/capacity.test.ts`)                                 |
| Review a change set                     | `docs/CODE_REVIEW_CHECKLIST.md`, then the Pre-Push Review                                                                |
| Propose an architecture decision        | Use `docs/templates/adr.md` with Status `Proposed`. Only the Tech Lead changes a status to `Accepted`                    |
| Write or change a runbook               | Use `docs/templates/runbook.md`. Write only steps that can be verified in the repository                                 |
| Check AC coverage                       | `docs/quality/traceability.md`                                                                                           |
| Prepare a commit                        | Conventional Commits, without AI attribution (see Commit Safety Gate)                                                    |

Before relying on any document, check its status in `docs/README.md` (section "Status dokumen").

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
├── docs/
│   ├── README.md                # Documentation index and document status
│   ├── CODING_STANDARD.md
│   ├── CODE_REVIEW_CHECKLIST.md
│   ├── architecture/            # overview.md, modules/ (one file per domain module), decisions/ (ADR-001 to ADR-015)
│   ├── api/                     # openapi.yaml, conventions.md, error-catalog.md, contract-changelog.md
│   ├── database/                # erd.md, schema.dbml, indexes.md, migration-policy.md
│   ├── security/                # authentication.md, rbac-matrix.md
│   ├── tasks/                   # Task breakdown per story; cross-cutting/ for work outside a story
│   ├── quality/                 # traceability.md (AC to endpoint to test)
│   ├── development/             # Local setup, conventions, git workflow, testing guide
│   ├── runbooks/                # deployment, rollback, troubleshooting, backup-restore
│   ├── ui-specs/                # Design system and QA evidence
│   └── templates/               # adr.md, runbook.md
├── .github/workflows/           # CI/CD pipelines
├── docker-compose.yml           # Local development infrastructure (db, api, web)
└── package.json                 # Monorepo root scripts & configuration
```

`docs/audits/` and `docs/ai/` are not committed yet. A committed document MUST NOT link to them.

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
- Allocation mutations MUST serialize per employee row using `SELECT ... FOR UPDATE` inside a database transaction (TSD 10.4, ADR-009). **Status: not implemented yet.** Allocation mutations still answer 501. Do not write code, docs, or claims that say the lock is already in effect until it is implemented and tested.
- The implementation status of every ADR is in the "Implementasi" column of `docs/architecture/decisions/README.md`. Do not claim an ADR is implemented unless that column says `Sesuai`.

### Scope and Domain Rules

- Business UI copy is clean Bahasa Indonesia / English as specified in PRD. Code identifiers, error codes, database tables/columns, and API fields are English. UI terms follow `docs/ui-specs/glossary.md`.
- The 4 application roles are: `ADMIN`, `PROJECT_MANAGER`, `RESOURCE_MANAGER`, `EMPLOYEE`.
- Product behavior must strictly match PRD acceptance criteria. Do not invent external microservices, queues, Redis, or AI matching scores (prohibited in MVP per ADR-010).
- Historical records are never hard-deleted: inactive employees, archived projects, and cancelled allocations remain visible in audit history. Removal of employee skill assignments is an open decision (ADR-013, Proposed). Until the Tech Lead decides, do not change that behavior.

### Code Quality

- **File size limit:** Keep production files under 300 lines; split proactively at 250 lines.
- **Strict TypeScript:** No `any`, no `// @ts-ignore`, no non-null assertions (`!`), no unsafe casts.
- Exported functions require explicit return types.
- Prefer `unknown` with narrowing. Zod schemas are the runtime validation source of truth.
- Enum-like values are string literal unions or Zod enums, never TypeScript `enum`.
- Do not read `process.env` inside feature modules. Use centralized configuration (`apps/api/src/config/env.ts`).
- No dead code, unused imports, console.log statements, or plaintext credentials in committed code.

## Database, Storage, and Security

- Change database schemas through committed Prisma migrations only. Never alter database schema manually. Migration steps are in `docs/database/migration-policy.md`.
- The database does not yet enforce the CHECK constraints required by TSD 12.1 (proficiency 1–5, allocation percentage 1–100, end date not before start date). See `docs/database/indexes.md` and ADR-014 (Proposed). Do not assume the database enforces these rules until a migration adds them.
- Passwords MUST be hashed using bcryptjs with cost factor 12.
- Session IDs MUST be stored server-side in PostgreSQL (`user_sessions` table via `connect-pg-simple`) with cookie name `staffora.sid`. Details: `docs/security/authentication.md`.
- State-changing HTTP requests (POST, PUT, PATCH, DELETE) MUST validate the CSRF synchronizer token from `GET /api/v1/auth/csrf-token`.
- Never log passwords, password hashes, session cookies, authorization headers, or CSRF tokens.
- Known configuration issues (session secret fallback, API port exposed in production, credentials in compose files, seed passwords in code, TLS not configured) are tracked in `docs/tasks/cross-cutting/security.md`. Do not add a new fallback secret or a new credential literal.

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
- Capacity test suite: run from `apps/api`: `npx vitest run tests/capacity.test.ts` (all 15 mandatory scenarios must pass)

API tests need PostgreSQL 18 with the migrations applied. Do not change the password of an existing database to make tests pass. Use a temporary container on another port and remove it afterwards. The steps are in `docs/database/migration-policy.md`, section "Lingkungan uji".

The local Docker database listens on host port 5433 (`docker compose up -d db`). Port 5432 is often taken by a local PostgreSQL install, so `DATABASE_URL` for the Docker database must use port 5433.

Use Node 24, as set in `engines` in `package.json` (`>=24 <25`). `.nvmrc` pins `24` for nvm users. If the local machine runs another Node version, say so in the gate report: the results may not match CI.

## Local Commands

```powershell
# Dependencies & Infrastructure
npm install
docker compose up -d db

# Database Operations
npm run db:migrate -w @staffora/api           # Dev: create and apply migrations
npm run db:migrate:deploy -w @staffora/api    # CI and production: apply committed migrations only
npm run db:seed -w @staffora/api              # Development data only

# Development Servers
npm run dev           # Hanya menjalankan web. Untuk API jalankan npm run dev:api di terminal lain
npm run dev:api       # Express API on http://localhost:3000
npm run dev:web       # Vite SPA on http://localhost:5173
npm run stack:up      # Full local stack with docker compose (dev overlay)

# Quality Gates
npm run lint          # ESLint across all workspaces
npm run typecheck     # TypeScript strict check across all workspaces
npm test              # Vitest test suites
npm run build         # Production builds for web and api
npm run format:check  # Prettier check

# OpenAPI Types
npm run api:types     # Generate TypeScript API types from openapi.yaml
```

## Context Recovery Checklist

If context is compacted, re-confirm:

- [ ] This is **Staffora**, an internal Project Resource Allocation & Workforce Planning System.
- [ ] Team: **Arya Isnaidi (Tech Lead)**, **Fikri (QA & DevOps)**, **Wahyu & Nabil (FE)**, **Saiful & Jundy (BE)**.
- [ ] Branching workflow: `git checkout dev` -> `git pull --rebase origin dev` -> `git checkout -b [FE/BE/DB/QA]-S<N>-[Kode]-subjudultask`.
- [ ] AI agent safety gate: DO NOT spontaneously commit or push without explicit verification and confirmation.
- [ ] Commits carry no AI attribution (no `Co-Authored-By: Claude`).
- [ ] No secret values in code, docs, commits, or logs. Name variables only.
- [ ] Before any developer push: run the Pre-Push Review (scope, gates, code review, coding standard, docs sync). Verdict is `BERSIH` or `ADA BLOCKER`.
- [ ] Trello card work: map the card to the task file, check that the task is `ready`, confirm the design source (Figma or `docs/ui-specs/`) and the contract (OpenAPI, ERD) before coding.
- [ ] Work starts from the task file in `docs/tasks/`. Only `ready` tasks, only the listed paths. A task that does not meet the Definition of Ready is `blocked`.
- [ ] Target integration branch is `dev`; `main` is protected and promoted only by Arya Isnaidi.
- [ ] File size limit: no production file exceeds 300 lines (split at 250 lines).
- [ ] Strict TypeScript: no `any`, no `@ts-ignore`, explicit return types.
- [ ] Capacity calculation is deterministic sweep-line; total concurrent allocation must never exceed 100%.
- [ ] Allocation mutations require transaction with `SELECT ... FOR UPDATE` row lock. This is not implemented yet (ADR-009).
- [ ] Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` before claiming completion.
