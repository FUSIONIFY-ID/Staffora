# Staffora — Dokumentasi Engineering

Folder ini berisi dokumentasi yang mendukung implementasi Staffora MVP v1.0. Folder ini tidak menggantikan sumber resmi produk dan teknis. Dokumen di sini merujuk ke sumber tersebut dengan ID atau nomor bagian.

## Sumber resmi (di Notion)

| Dokumen | Isi | Dipakai untuk |
| --- | --- | --- |
| PRD: Product Requirements, User Stories & Acceptance Criteria (MVP v1.0) | Story, AC, BR, role, sprint | Apa yang harus dibuat |
| TSD: Technical Specification Document (MVP v1.0) | Stack, arsitektur, data model, kapasitas, keamanan, pengujian | Bagaimana membuatnya |

Aturan dokumen:
- Dokumen di repo merujuk ke ID AC dan nomor bagian TSD. Teks tidak disalin.
- Perubahan kontrak API mengubah `docs/api/openapi.yaml` di PR yang sama.
- Perubahan schema mengubah migration dan `docs/database/erd.md` di PR yang sama.
- Perubahan arsitektur butuh ADR baru di `docs/architecture/decisions/`.

## Peta folder

| Folder | Isi | Pemilik |
| --- | --- | --- |
| [`architecture/`](architecture/overview.md) | Gambaran sistem, batas modul, ADR, dokumen per modul | Tech Lead |
| [`architecture/modules/`](architecture/modules/) | Satu dokumen per modul backend: tanggung jawab, endpoint, entitas, dan drift | Backend |
| [`architecture/decisions/`](architecture/decisions/README.md) | Architecture Decision Records | Tech Lead |
| [`api/`](api/openapi.yaml) | Kontrak OpenAPI, [konvensi API](api/conventions.md), [katalog error](api/error-catalog.md), dan changelog kontrak | Backend |
| [`database/`](database/erd.md) | ERD, DBML, [index dan constraint](database/indexes.md), dan [kebijakan migrasi](database/migration-policy.md) | Backend |
| [`security/`](security/authentication.md) | Autentikasi, sesi, CSRF, dan [matriks akses peran](security/rbac-matrix.md) | Backend dan Tech Lead |
| [`tasks/`](tasks/README.md) | Task per story, dengan path yang boleh disentuh dan tes wajib | Tech Lead dan Backend/Frontend |
| [`quality/`](quality/traceability.md) | Pemetaan AC ke endpoint dan tes | QA |
| [`development/`](development/local-setup.md) | Setup lokal, konvensi, git workflow, panduan tes | Tech Lead |
| [`runbooks/`](runbooks/deployment.md) | Prosedur deployment, rollback, dan troubleshooting | QA dan DevOps |
| [`ui-specs/`](ui-specs/design-system/design-system.md) | Design system dan bukti QA layar | Frontend |
| [`templates/`](templates/adr.md) | Template ADR, dokumen modul, dan runbook | Tech Lead |

Dokumen tingkat repo yang tetap di root `docs/`:
- [`CODING_STANDARD.md`](CODING_STANDARD.md)
- [`CODE_REVIEW_CHECKLIST.md`](CODE_REVIEW_CHECKLIST.md)

## Mulai dari mana

- Developer baru: [local setup](development/local-setup.md), lalu [overview](architecture/overview.md).
- Mengerjakan story: [daftar task](tasks/README.md), lalu dokumen modul yang disebut task-nya.
- Mengubah API: [OpenAPI](api/openapi.yaml) dan [changelog kontrak](api/contract-changelog.md).
- Mengubah schema: [ERD](database/erd.md) dan [schema.dbml](database/schema.dbml).
- Mengurus deployment atau insiden: [runbooks](runbooks/deployment.md).

## Status dokumen

| Dokumen | Status |
| --- | --- |
| `architecture/overview.md` | Perlu sinkron dengan kode (lihat catatan di dokumen) |
| `architecture/modules/*` | Dibuat dari kode, ada bagian "Belum diverifikasi" |
| `architecture/decisions/*` | 11 Accepted (ADR-001 sampai 011), 4 Proposed (ADR-012 sampai 015) |
| `api/conventions.md`, `api/error-catalog.md` | Dibuat dari kode `app.ts`, `apps/api/src/common/http`, dan `apps/api/src/common/errors`. Kesesuaian dengan TSD §11 belum diverifikasi |
| `security/authentication.md` | Dibuat dari `apps/api/src/common/auth`. Kutipan TSD §8 belum diverifikasi penuh |
| `security/rbac-matrix.md` | Dibuat dari guard di routes. Pembatasan per data belum dicek semua |
| `database/indexes.md` | Dibuat dari migrasi. Tiga `CHECK` dari TSD §12.1 belum ada |
| `database/migration-policy.md` | Sebagian usulan, ditandai di dokumen |
| `quality/traceability.md` | Parsial: US02.02 dan US01.01 terpetakan, sisanya belum |
| `tasks/sprint-1/US02.02.md` | 4 task: 2 blocked, 1 ready, 1 done |
| `runbooks/deployment.md` | Ditulis dari workflow dan compose. Pipeline deploy hanya build image. Push, migrasi, rollout, dan smoke test belum ada di repo |
| `runbooks/rollback.md` | Ditulis ulang. Target rollback belum ada karena tidak ada tag atau image yang dipush. Belum diuji |
| `runbooks/troubleshooting.md` | Ditulis ulang. Perintah dan respons dicek terhadap kode, sebagian diuji di container sementara |
| `runbooks/backup-restore.md` | Kebijakan dari TSD, mekanisme belum ada di repo. Restore belum diuji |
