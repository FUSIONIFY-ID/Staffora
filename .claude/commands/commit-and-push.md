---
name: Commit and Push Safely
description: Commit and push Staffora changes only after preflight, verification, and remote-divergence checks
---

# Commit and Push Safely

Use this workflow whenever a developer explicitly asks an AI to commit or push. A request to commit
authorizes a local commit only. A request to push authorizes a normal, non-force push only.
Team members (Saiful & Jundy for BE, Wahyu & Nabil for FE, Fikri for QA/DevOps) must never commit or push
without passing all verification gates and receiving approval from Tech Lead Arya Isnaidi.

## Pre-Commit Gate

1. Inspect `git status --short`, `git diff --stat`, and the focused diff. Stop if unrelated or
   unexplained changes would be included; never silently stage another developer's work.
2. Confirm the current branch is not `dev` or `main`. Direct commits and pushes to protected
   branches are strictly prohibited.
3. Confirm branch name strictly follows `[FE/BE/DB/QA]-S<SprintNumber>-[Kode]-subjudultask`.
4. Read the assigned task card and linked docs (`USxx.xx`, `ACxx.xx`). Ensure the diff stays within scope.
5. Check file length limits: every production file must be strictly under 300 lines (proactively decomposed at 250 lines).
6. Stage only intended paths with explicit `git add <path>` commands. Never use `git add -A` or
   `git add .` blindly.
7. Inspect `git diff --cached --stat`, `git diff --cached --check`, and the staged diff.
8. Ensure no `.env`, `*.pem`, credentials, session secrets, or private tokens are staged.
9. Run the applicable verification:
   - Full repository check: `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
   - Documentation-only changes: check formatting and spelling.
   - Database / Prisma changes: verify migration with `npm run test:db --workspace=api` when PostgreSQL container is available.
10. For Prisma migrations, confirm generated SQL files are intentional, current against `dev`,
    and follow `docs/CODING_STANDARD.md` and `docs/database/erd.md`.
11. Create one Conventional Commit referencing the Task ID. Do not add `Co-Authored-By` trailers.
    Example: `feat(auth): [BE-S1-US01] implement session authentication endpoints`
12. Verify the created commit with `git show --stat --oneline HEAD`.

## Pre-Push Gate

1. Confirm an `origin` remote and a correctly named task branch exist. If either is missing, stop
   and report the required setup; do not invent a remote URL.
2. Fetch without modifying the worktree:

   ```powershell
   git fetch --prune origin
   ```

3. Compare the branch with its upstream, or with the intended base branch (`origin/dev` for normal
   task work). If the branch is behind or `origin/dev` has advanced, rebase from `dev`:

   ```powershell
   git pull --rebase origin dev
   ```

   If conflicts arise, stop and report. Do not resolve conflicts destructively without instruction.

4. Re-run verification (`npm run lint && npm run typecheck && npm test`) if code changed during rebase.
5. Push with a normal push only:

   ```powershell
   git push -u origin HEAD
   ```

6. If Git rejects the push, stop. Inspect the rejection and report the divergence or permission
   issue. Never use `--force`, `--force-with-lease`, or direct pushes to protected branches unless
   Tech Lead Arya Isnaidi explicitly authorizes a specific recovery operation.
7. PRs must target `dev` as the base branch, never `main`.

## Stop Conditions

Stop and ask for direction when any of these occur:

- Merge/rebase conflict or remote divergence.
- Unrelated working-tree changes or an uncertain file owner.
- Failed lint, typecheck, or test check.
- Production file exceeding 300 lines limit.
- Suspected secret/sensitive credential data in the staged diff.
- Missing remote, missing upstream, protected-branch target (`dev`/`main`), or rejected push.

## Completion Report & Pull Request Description Generation

Report the commit hash, commit message, branch, verification evidence, and push result.
Whenever a push or PR creation is ready, you MUST generate the ready-to-use Pull Request draft formatted strictly according to the Staffora PR template below:

````markdown
## Task Reference

- Task ID: <Task ID, e.g. BE-S1-US01-session-auth>
- PIC: <Developer PIC, e.g. Saiful / Jundy / Wahyu / Nabil / Fikri>
- User Story: <User Story, e.g. US01.01>
- Sprint: <Sprint Number, e.g. Sprint 1>
- AC covered: <AC covered, e.g. AC01.01, AC01.02>

## Target Branch

- [x] `dev` - integration and internal acceptance
- [ ] `main` - production release

## What Changed

- **Frontend (`apps/web`):**
  - <Detail frontend changes, UI components, forms, TanStack Query hooks>

- **Backend Modules (`apps/api`):**
  - <Detail domain module changes, routes, controllers, services, repositories>

- **Database & Prisma (`apps/api/prisma`):**
  - <Detail schema modifications, Prisma migrations, seed data changes>

- **Testing & Documentation:**
  - <Detail added unit/integration tests, OpenAPI spec updates, ERD updates>

## Why

<Explain the business rationale and acceptance criteria being fulfilled>
1. **<AC Code>:** <Explanation>
2. **<AC Code>:** <Explanation>

## How to Test

1. Jalankan unit test dan quality gate:
   ```powershell
   npm run lint
   npm run typecheck
   npm test
   npm run build
   ```
````

2. Jalankan test suite modul spesifik jika relevan:
   ```powershell
   npx vitest run tests/capacity.test.ts
   npm test -w @staffora/web
   ```
3. Uji endpoint API secara manual atau via HTTP client / UI:
   - <Langkah pengujian>

## Impact

- Migration impact: <None / detail Prisma migration file>
- Environment/config impact: <None / detail new .env keys>
- Security and authorization impact: <Detail RBAC policies, CSRF handling, session security>
- Documentation updated: <docs/api/openapi.yaml, docs/database/erd.md, etc.>

## Acceptance Evidence

| AC        | Environment             | Role / Test Account | Expected Result   | Observed Result |
| --------- | ----------------------- | ------------------- | ----------------- | --------------- |
| <AC Code> | Local Dev / Integration | <Role>              | <Expected result> | PASS <evidence> |

---

## Pre-PR Checklist

- [x] Scope matches the assigned card and linked business, API, and technical docs.
- [x] I have self-reviewed against `docs/CODE_REVIEW_CHECKLIST.md`.
- [x] All 4 quality gates pass locally (`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`).
- [x] The task is ready for review on the internal board, where a board is used.
- [x] No `.env`, `*.pem`, credentials, session secrets, or private tokens are committed or logged.
- [x] Migration files, if any, were generated after rebasing on `dev` and reviewed.
- [x] Relevant tests, configuration, docs (`openapi.yaml`, `erd.md`), and acceptance evidence are updated.
- [x] UI work considers loading, empty, error, retry, denied (403), and success states.
- [x] All production files stay strictly under 300 lines limit (split at 250 lines).
- [x] No unrelated refactor or unapproved sprint scope is included.

## Tech Lead Review

<!-- Arya Isnaidi (Tech Lead) completes this section. -->

- [ ] Approved
- [ ] Changes requested

```

```
