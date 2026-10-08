---
name: developer-pre-pr-checklist
description: Verify Staffora changes before opening a pull request into dev.
---

# Staffora Pre-PR Checklist

The Tech Lead (**Arya Isnaidi**) is the approving reviewer. Normal work targets `dev`; `main` is release-only.

## Required Verification Gate

Run from the repository root:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

## Rebase & Branch Requirements

1. Rebase branch on latest `dev`:
   ```bash
   git checkout dev
   git pull --rebase origin dev
   git checkout <your-branch>
   git rebase dev
   ```
2. Verify branch name follows `[FE/BE/DB/QA]-S<SprintNumber>-[Kode]-subjudultask`.
3. Self-review against `docs/CODE_REVIEW_CHECKLIST.md`.

## PR Self-Review Checklist

- [ ] User story (`USxx.xx`) and acceptance criteria (`ACxx.xx`) are in the PR description.
- [ ] PR description strictly uses the standardized template (`.github/pull_request_template.md`).
- [ ] Diff is strictly scoped; no `.env`, build artifacts (`dist/`), temporary logs, or credentials committed.
- [ ] All production files stay strictly under 300 lines (proactively split at 250 lines).
- [ ] Server-side authorization and Capacity validation are enforced in backend.
- [ ] All 15 Mandatory Capacity Scenarios pass if allocation logic was touched.
- [ ] PR targets `dev` (never push directly to `dev` or `main`).
- [ ] CI pipeline is green before requesting review from Arya Isnaidi.

## Standard Pull Request Description Template

Every Pull Request must be formatted using `.github/pull_request_template.md`:

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
  - <Detail frontend changes>

- **Backend Modules (`apps/api`):**
  - <Detail backend changes>

- **Database & Prisma (`apps/api/prisma`):**
  - <Detail schema / migration changes>

- **Testing & Documentation:**
  - <Detail test suites & documentation changes>

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

- Migration impact: <None / detail migration>
- Environment/config impact: <None / detail new keys>
- Security and authorization impact: <Detail RBAC / CSRF / security>
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
