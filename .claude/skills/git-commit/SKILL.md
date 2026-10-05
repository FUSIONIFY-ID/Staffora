---
name: git-commit
description: Create a scoped Staffora commit only after verification, staged-diff review, and the project safety gate.
---

# Skill: git-commit

## When to Use

Use only after Tech Lead or developer explicitly asks to commit, the assigned Staffora task is complete, and all 4 quality gates have passed. For a push request, also read `.claude/commands/commit-and-push.md`.

## Required Pre-Commit Checks

1. Read `CLAUDE.md`, the assigned user story (`USxx.xx`), and acceptance criteria (`ACxx.xx`).
2. Inspect the worktree and focused changes:
   ```powershell
   git status --short
   git diff --stat
   ```
3. **Never stage blindly**: Do not run `git add .` or `git add -A`. Stage only files belonging to the assigned task:
   ```powershell
   git add apps/api/src/modules/allocations/
   git add apps/api/tests/capacity.test.ts
   ```
4. Confirm current branch is NOT `dev` or `main`. Branch must follow `[FE/BE/DB/QA]-S<SprintNumber>-[Kode]-subjudultask`.
5. Ensure no `.env`, build artifacts (`dist/`), temporary logs, or credentials are staged.
6. Verify all 4 quality gates pass:
   ```powershell
   npm run lint
   npm run typecheck
   npm test
   npm run build
   ```

## Commit Message Format

```text
<type>(<scope>): <subject> [USxx.xx - ACxx.xx]
```

Allowed types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`.
Staffora scopes: `auth`, `workforce`, `skills`, `projects`, `staffing`, `allocations`, `capacity`, `dashboard`, `web`, `api`, `db`, `ci`, `docs`.

Examples:
- `feat(allocations): add row-lock capacity concurrency guard [US04.01 - AC03.08]`
- `fix(projects): disallow end date before start date [US03.01 - AC02.05]`
- `test(capacity): add all 15 mandatory capacity scenarios [US05.01 - AC02.03]`
- `chore(ci): add lint and typecheck matrix to GitHub Actions`

## Commit and Verify

```powershell
git commit -m "feat(allocations): add row-lock capacity concurrency guard [US04.01 - AC03.08]"
git show --stat --oneline HEAD
```
