---
name: Start Task Safely
description: Analyze a Staffora request, verify Git rebase state from dev, and define the task before implementation
---

# Start Task Safely

Use this workflow before implementing any developer request, especially when the request is vague,
contains only a task sentence, or includes a UI mock/screenshot.

## 1. Understand the Request

1. Read `CLAUDE.md` and identify whether the request is a bug, feature, refactor, documentation,
   infrastructure, or review task.
2. Locate the matching approved User Story (`USxx.xx`), Acceptance Criteria (`ACxx.xx`), and Business Rules (`BR-Gxx`)
   in the PRD, TSD, `docs/api/openapi.yaml`, and `docs/database/erd.md`.
3. Identify the responsible team member:
   - **Tech Lead**: Arya Isnaidi
   - **QA & DevOps**: Fikri
   - **Frontend (FE)**: Wahyu & Nabil
   - **Backend (BE)**: Saiful & Jundy
4. For Frontend work, inspect responsive behavior (1440px / 1280px), required UI states (loading, empty, error, forbidden 403, success), and role-based permissions.
5. For Backend work, trace the API contract, Prisma schema, authorization policies, audit requirements, and Capacity engine invariants (`CapacityService` with `SELECT ... FOR UPDATE` row lock).
6. If no approved PRD story exists, consult Tech Lead Arya Isnaidi. Do not silently invent features.

## 2. Verify Git State Before Coding

Run read-only checks first:

```powershell
git status --short --branch
git branch --show-current
git log -1 --oneline --decorate
```

Then:
1. Implementation must NEVER happen directly on `dev` or `main`.
2. Sync and rebase from `dev`:
   ```powershell
   git checkout dev
   git pull --rebase origin dev
   git checkout -b <nama-branch>
   ```
3. If the worktree is dirty, do not switch, stash, reset, or discard; report the files and ask for direction.

## 3. Branch Naming Standard

Every branch MUST strictly follow the pattern:

```text
[FE/BE/DB/QA]-S<SprintNumber>-[Kode]-subjudultask
```

Examples:
- `FE-S1-US01-login-screen`
- `BE-S1-US01-session-auth-endpoints`
- `DB-S1-US01-user-sessions-schema`
- `FE-S2-US03-project-list-and-detail`
- `BE-S2-US03-staffing-requirement-crud`
- `BE-S3-US04-allocation-concurrency-lock`
- `FE-S3-US05-capacity-timeline-view`
- `QA-S1-US01-verify-auth-session-flow`

## 4. Analysis Handoff

Before writing implementation code, report:
- Current branch, base rebase state (`origin/dev`), and dirty files status.
- Task ID, layer (`FE`/`BE`/`DB`/`QA`), PIC, User Story (`USxx.xx`), and AC (`ACxx.xx`).
- Planned files, tests, and API/database contracts involved.
- Strict adherence to the 300-line file limit.
- Verification plan (`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`).
