# Git Workflow & Rebase Collaboration Guidelines

Dokumen ini mengatur alur kerja Git, standar penamaan branch, dan aturan keselamatan commit/push untuk tim internal Staffora.

---

## 1. Struktur Tim & Pembagian Tanggung Jawab

| Peran                  | Anggota Tim        | Tanggung Jawab Utama                                                       |
| :--------------------- | :----------------- | :------------------------------------------------------------------------- |
| **Tech Lead**          | **Arya Isnaidi**   | Arsitektur, approval PR/release, ADR, dan final acceptance sign-off        |
| **QA & DevOps**        | **Fikri**          | Infrastruktur CI/CD, Docker, automation, pengujian regresi & E2E           |
| **Frontend Engineers** | **Wahyu & Nabil**  | Implementasi Web UI, forms, state management TanStack Query (Stream A & B) |
| **Backend Engineers**  | **Saiful & Jundy** | Express.js API, Prisma migrations, Capacity engine, RBAC (Stream A & B)    |

> ⚠️ **Catatan Penting Tech Lead (Arya Isnaidi):**
> Mengingat engineer pelaksana bertaraf junior, seluruh developer dan AI Agent **DILARANG KERAS** mengembangkan fitur di luar scope, dilarang asal commit, dilarang asal push, dan dilarang bypass quality gates. Setiap pekerjaan wajib memiliki kartu / User Story (`USxx.xx — ACxx.xx`) yang jelas.

---

## 2. Alur Branching Menggunakan Rebase

Seluruh pengerjaan fitur baru **WAJIB** berbasis pada branch `dev` menggunakan alur **rebase**:

### Langkah 1: Sinkronisasi & Rebase dari `dev`

Sebelum membuat branch baru, pastikan branch `dev` lokal mutakhir:

```bash
git checkout dev
git pull --rebase origin dev
```

### Langkah 2: Buat Branch Fitur Baru

Gunakan format nama branch yang telah dibakukan:

```bash
git checkout -b <nama-branch>
```

---

## 3. Format Baku Penamaan Branch

Format branch:

```text
[FE/BE/DB/QA]-S<SprintNumber>-[Kode]-subjudultask
```

### Prefix Layer:

- `FE` : Dikerjakan oleh Frontend (Wahyu / Nabil)
- `BE` : Dikerjakan oleh Backend (Saiful / Jundy)
- `DB` : Skema database, migrasi Prisma, atau seeding (Saiful / Jundy / Arya)
- `QA` : Pengujian otomatis, CI/CD, atau verifikasi akseptansi (Fikri)

### Contoh Penamaan yang Valid:

- `FE-S1-US01-login-screen`
- `BE-S1-US01-session-auth-endpoints`
- `DB-S1-US01-user-sessions-schema`
- `FE-S2-US03-project-list-and-detail`
- `BE-S2-US03-staffing-requirement-crud`
- `BE-S3-US04-allocation-concurrency-lock`
- `FE-S3-US05-capacity-timeline-view`
- `QA-S1-US01-verify-auth-session-flow`

> ❌ **Dilarang:** Menggunakan nama branch sembarangan seperti `feature/login`, `fix-bug`, `test`, `wahyu-branch`, atau langsung bekerja di `dev` / `main`.

---

## 4. Siklus Kerja & Sinkronisasi Sebelum PR

Sebelum mengajukan Pull Request, lakukan rebase kembali ke `dev` terbaru untuk mencegah konflik:

```bash
# 1. Update dev lokal
git checkout dev
git pull --rebase origin dev

# 2. Rebase branch kerja Anda di atas dev terbaru
git checkout <nama-branch-anda>
git rebase dev

# 3. Jalankan verifikasi lokal (wajib lulus 100%)
npm run lint
npm run typecheck
npm test
npm run build

# 4. Push branch kerja Anda ke remote
git push -u origin <nama-branch-anda>
```

---

## 5. Aturan Keselamatan Commit & Push (Safety Gate)

Developer dan AI Agent wajib mematuhi batasan berikut:

1. **Dilarang Push Langsung ke `dev` atau `main`**: Setiap perubahan hanya boleh masuk ke `dev` melalui Pull Request yang telah di-review dan di-approve.
2. **Dilarang Blind Staging (`git add .` / `git add -A`)**: Stage hanya file yang spesifik diubah untuk task tersebut (`git add <file1> <file2>`). Jangan memasukkan file temporary, `.env`, log, atau build artifacts.
3. **Commit Message Standar Conventional Commits**:
   ```text
   <type>(<scope>): <subject> [USxx.xx - ACxx.xx]
   ```
   Contoh:
   - `feat(auth): implement session cookie authentication [US01.01 - AC02.01]`
   - `feat(capacity): add sweep-line concurrent workload engine [US05.01 - AC02.03]`
   - `fix(projects): prevent allocation outside project date window [US04.01 - AC02.08]`
   - `test(capacity): add tests for 15 mandatory capacity scenarios [US04.01 - AC03.01]`
4. **Mandatory Quality Gate**: Dilarang commit jika salah satu dari `lint`, `typecheck`, `test`, atau `build` gagal.

---

## 6. Format Standar Deskripsi Pull Request (PR Template)

Setiap Pull Request yang diajukan ke `dev` **WAJIB** menggunakan format standar deskripsi PR yang tersimpan di [`.github/pull_request_template.md`](../../.github/pull_request_template.md):

````markdown
## Task Reference

- Task ID: [FE/BE/DB/QA]-S<SprintNumber>-[Kode]-subjudultask
- PIC: Wahyu / Nabil / Saiful / Jundy / Fikri
- User Story: USxx.xx
- Sprint: Sprint <N>
- AC covered: ACxx.xx, ACxx.xx

## Target Branch

- [x] `dev` - integration and internal acceptance
- [ ] `main` - production release

## What Changed

- **Frontend (`apps/web`):**
  - <Ringkasan perubahan UI/komponen/hooks>

- **Backend Modules (`apps/api`):**
  - <Ringkasan perubahan rute/controller/service/repository>

- **Database & Prisma (`apps/api/prisma`):**
  - <Ringkasan perubahan skema/migrasi/seeding>

- **Testing & Documentation:**
  - <Ringkasan penambahan unit/integration tests dan update docs>

## Why

Memenuhi kriteria penerimaan sprint:

1. **ACxx.xx:** <Penjelasan bisnis>
2. **ACxx.xx:** <Penjelasan bisnis>

## How to Test

1. Jalankan quality gate:
   ```powershell
   npm run lint
   npm run typecheck
   npm test
   npm run build
   ```
````

2. Jalankan test suite relevan:
   ```powershell
   npx vitest run tests/capacity.test.ts
   npm test -w @staffora/web
   ```
3. Verifikasi manual API / UI:
   - <Langkah pengujian>

## Impact

- Migration impact: None / <nama migrasi>
- Environment/config impact: None / <key baru>
- Security and authorization impact: <Penjelasan RBAC / CSRF / sesi>
- Documentation updated: docs/api/openapi.yaml, docs/database/erd.md, etc.

## Acceptance Evidence

| AC      | Environment             | Role / Test Account | Expected Result | Observed Result |
| ------- | ----------------------- | ------------------- | --------------- | --------------- |
| ACxx.xx | Local Dev / Integration | <Role>              | <Expected>      | PASS            |

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

---

## 7. Review & Approval Pull Request

- **Target PR**: Seluruh PR fitur normal mengarah ke branch `dev`.
- **Reviewer Tunggal**: **Arya Isnaidi (Tech Lead)** melakukan review akhir berdasarkan checklist di [docs/CODE_REVIEW_CHECKLIST.md](../CODE_REVIEW_CHECKLIST.md).
- **Branch `main`**: Merupakan branch produksi yang diproteksi. Promosi dari `dev` ke `main` hanya dilakukan oleh Arya Isnaidi setelah pengujian regresi oleh Fikri (QA) dinyatakan lulus.

```
