## Task Reference

- Task ID: <!-- e.g. BE-S1-US01-session-auth -->
- PIC: <!-- e.g. Saiful / Jundy / Wahyu / Nabil / Fikri -->
- User Story: <!-- e.g. US01.01 -->
- Sprint: <!-- e.g. Sprint 1 -->
- AC covered: <!-- e.g. AC01.01, AC01.02 -->

## Target Branch

- [x] `dev` - integration and internal acceptance
- [ ] `main` - production release

## What Changed

- **Frontend (`apps/web`):**
  - <!-- Detail frontend changes, UI components, forms, TanStack Query hooks -->

- **Backend Modules (`apps/api`):**
  - <!-- Detail domain module changes, routes, controllers, services, repositories -->

- **Database & Prisma (`apps/api/prisma`):**
  - <!-- Detail schema modifications, Prisma migrations, seed data changes -->

- **Testing & Documentation:**
  - <!-- Detail added unit/integration tests, OpenAPI spec updates, ERD updates -->

## Why

<!-- Explain the business rationale and acceptance criteria being fulfilled -->

1. **ACxx.xx:** <!-- Keterangan pemenuhan AC -->
2. **ACxx.xx:** <!-- Keterangan pemenuhan AC -->

## How to Test

1. Jalankan unit test dan quality gate:
   ```powershell
   npm run lint
   npm run typecheck
   npm test
   npm run build
   ```
2. Jalankan test suite modul spesifik jika relevan:
   ```powershell
   npx vitest run tests/capacity.test.ts
   npm test -w @staffora/web
   ```
3. Uji endpoint API secara manual atau via HTTP client / UI:
   - <!-- Langkah verifikasi fungsionalitas / endpoint -->

## Impact

- Migration impact: <!-- None / detail Prisma migration file -->
- Environment/config impact: <!-- None / detail new .env keys -->
- Security and authorization impact: <!-- Detail RBAC policies, CSRF handling, session security -->
- Documentation updated: <!-- docs/api/openapi.yaml, docs/database/erd.md, etc. -->

## Acceptance Evidence

| AC      | Environment             | Role / Test Account            | Expected Result                | Observed Result              |
| ------- | ----------------------- | ------------------------------ | ------------------------------ | ---------------------------- |
| ACxx.xx | Local Dev / Integration | <!-- e.g. ADMIN / EMPLOYEE --> | <!-- Hasil yang diharapkan --> | PASS <!-- bukti test/log --> |
| ACxx.xx | Local Dev / Integration | <!-- e.g. PROJECT_MANAGER -->  | <!-- Hasil yang diharapkan --> | PASS <!-- bukti test/log --> |

---

## Pre-PR Checklist

- [x] Scope matches the assigned card and linked business, API, and technical docs (`USxx.xx — ACxx.xx`).
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
