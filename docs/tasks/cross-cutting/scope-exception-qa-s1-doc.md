# Pengecualian scope: branch QA-S1-DOC-docs-restructure

- Status: Disetujui
- Tanggal: 2026-11-02
- Penyetuju: Arya Isnaidi (Tech Lead). Keputusan dicatat dari sesi kerja. Identitas penyetuju tidak diverifikasi oleh agent.
- Berlaku untuk: branch `QA-S1-DOC-docs-restructure` saja.

## Dasar

Branch ini mengubah dokumen tata kelola dan konfigurasi yang tidak punya task di `docs/tasks/`. Sesuai aturan Pre-Push langkah 1, setiap path yang berubah harus tercantum di Boleh disentuh. Pengecualian ini memberi izin tertulis untuk path di bawah, sebagai satu batch, untuk branch ini.

## Ketentuan

- Commit memakai tag `[QA-S1-DOC]` untuk dokumen, atau `[QA-S1-SEC]` untuk perubahan keamanan.
- Pengecualian ini tidak menambah Boleh disentuh ke task mana pun.
- Path di luar daftar ini tetap butuh keputusan baru dari Tech Lead.
- File ini sendiri termasuk dalam daftar.

## Path yang disetujui

- `.env.example`
- `.gitattributes`
- `.githooks/commit-msg`
- `.githooks/pre-push`
- `.github/workflows/ci.yml`
- `.nvmrc`
- `AGENTS.md`
- `CLAUDE.md`
- `GEMINI.md`
- `README.md`
- `apps/api/.env.example`
- `apps/api/.env.test.example`
- `apps/api/src/config/env.ts`
- `apps/api/tests/session-security.test.ts`
- `apps/api/vitest.config.ts`
- `docker-compose.yml`
- `docs/README.md`
- `docs/api/conventions.md`
- `docs/api/error-catalog.md`
- `docs/architecture/decisions/README.md`
- `docs/architecture/decisions/adr-012-project-status-set.md`
- `docs/architecture/decisions/adr-013-employee-skill-removal.md`
- `docs/architecture/decisions/adr-014-database-check-constraints.md`
- `docs/architecture/decisions/adr-015-proficiency-label-scale.md`
- `docs/architecture/modules/allocations.md`
- `docs/architecture/modules/capacity.md`
- `docs/architecture/modules/dashboard.md`
- `docs/architecture/modules/identity.md`
- `docs/architecture/modules/projects.md`
- `docs/architecture/modules/resource-finder.md`
- `docs/architecture/modules/skills.md`
- `docs/architecture/modules/staffing.md`
- `docs/architecture/modules/workforce.md`
- `docs/architecture/overview.md`
- `docs/database/indexes.md`
- `docs/database/migration-policy.md`
- `docs/development/git-workflow.md`
- `docs/development/local-setup.md`
- `docs/development/testing-guide.md`
- `docs/quality/traceability.md`
- `docs/runbooks/backup-restore.md`
- `docs/runbooks/deployment.md`
- `docs/runbooks/rollback.md`
- `docs/runbooks/troubleshooting.md`
- `docs/security/authentication.md`
- `docs/security/rbac-matrix.md`
- `docs/tasks/README.md`
- `docs/tasks/cross-cutting/security.md`
- `docs/tasks/sprint-1/US02.02.md`
- `docs/templates/adr.md`
- `docs/templates/runbook.md`
- `docs/ui-specs/README.md`
- `docs/ui-specs/figma-screen-map.md`
- `docs/ui-specs/glossary.md`
- `docs/tasks/cross-cutting/scope-exception-qa-s1-doc.md`
