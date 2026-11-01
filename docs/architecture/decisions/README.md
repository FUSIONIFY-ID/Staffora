# Architecture Decision Records

Setiap keputusan arsitektur yang mengikat lintas modul dicatat sebagai ADR. Format mengikuti [template](../../templates/adr.md). Keputusan yang berubah setelah baseline harus punya ADR baru. ADR lama tidak dihapus, statusnya diubah menjadi `Superseded`.

| ADR | Judul | Status | TD | Implementasi |
| --- | --- | --- | --- | --- |
| [001](adr-001-modular-monolith.md) | Modular monolith | Accepted | TD-001 | Sebagian. Sembilan folder modul ada di `apps/api/src/modules/`, dan tidak ditemukan import repository lintas modul. Modul `dashboard` hanya stub di `apps/api/src/modules/dashboard/dashboard.routes.ts:8`. |
| [002](adr-002-monorepo-workspaces.md) | Monorepo dengan npm Workspaces | Accepted | TD-002 | Sesuai. Workspace di `package.json:8-11`. Tidak ada import dari `apps/web` ke `apps/api/src`. |
| [003](adr-003-react-vite-spa.md) | React 19 dan Vite 8 untuk SPA | Accepted | TD-003 | Sesuai. Versi di `apps/web/package.json:17-23` dan `:42`. Mode strict di `apps/web/tsconfig.app.json:18`. |
| [004](adr-004-nodejs-express-esm.md) | Node.js 24 LTS dan Express 5 dengan ESM | Accepted | TD-004 | Sebagian. ESM di `apps/api/package.json:5` dan Express 5 di `:26`. Dari tujuh file standar per modul, hanya modul `skills` dan `workforce` yang lengkap. |
| [005](adr-005-postgres-prisma.md) | PostgreSQL 18 dan Prisma ORM 7 | Accepted | TD-005 | Sebagian. PostgreSQL 18 di `docker-compose.yml:3`, Prisma 7 di `apps/api/package.json:21`. `$queryRaw` tanpa locking ada di `apps/api/src/modules/health/health.routes.ts:15`. |
| [006](adr-006-session-auth.md) | Session cookie server-side di PostgreSQL | Accepted | TD-006 | Sesuai. Cookie, rolling 8 jam, dan regenerasi sesi di `apps/api/src/common/auth/session.ts:40-107`. CSRF di `apps/api/src/common/auth/csrf.ts:22-35`. |
| [007](adr-007-deployment-topology.md) | Nginx dan Docker Compose di satu VM Linux untuk MVP | Accepted | TD-007 | Sebagian. Tiga layanan ada di `docker-compose.yml`. TLS belum ada (`apps/web/nginx.conf:2` hanya `listen 80`). Tidak ada skrip backup di repo. |
| [008](adr-008-ci-cd-pipeline.md) | GitHub Actions dan GHCR | Accepted | TD-008 | Sebagian. CI ada di `.github/workflows/ci.yml:19-83`. Deploy hanya build image di `.github/workflows/deploy-staging.yml:19-22`. Belum ada push ke GHCR. |
| [009](adr-009-allocation-concurrency-row-lock.md) | Serialisasi mutasi alokasi dengan row lock karyawan | Accepted | TD-009 | Belum. Mutasi alokasi masih NotImplemented di `apps/api/src/modules/allocations/allocations.service.ts:54` dan `:73`. Lihat [modul allocations](../modules/allocations.md). |
| [010](adr-010-lean-architecture-no-queue.md) | Tanpa Redis, queue, atau object storage di MVP | Accepted | TD-010 | Sesuai. Tidak ada Redis, queue, atau storage eksternal di `docker-compose.yml` dan `apps/api/package.json:19-33`. Status turunan ada di `apps/api/src/modules/workforce/workforce.views.ts:113-117`. |
| [011](adr-011-figma-design-system-light-mode.md) | Design system Figma dan light mode saja | Accepted | TD-011 | Sebagian. Light only dan `@theme` ada di `apps/web/src/index.css:12,74`. Kelas `md:` di `apps/web/src/app/layouts/app-sidebar.tsx:40` mengubah sidebar pada lebar 768px, padahal ADR mencatat perilaku di bawah 1280px belum didefinisikan. `docs/development/coding-conventions.md` belum merujuk ADR ini. |
| [012](adr-012-project-status-set.md) | Himpunan status proyek | Proposed | belum ditetapkan | — (Proposed, belum mengikat) |
| [013](adr-013-employee-skill-removal.md) | Penghapusan penugasan skill karyawan | Proposed | belum ditetapkan | — (Proposed, belum mengikat) |
| [014](adr-014-database-check-constraints.md) | Constraint CHECK di database | Proposed | belum ditetapkan | — (Proposed, belum mengikat) |
| [015](adr-015-proficiency-label-scale.md) | Label skala proficiency | Proposed | belum ditetapkan | — (Proposed, belum mengikat) |

Kolom **Implementasi** menilai kode di working tree cabang `QA-S1-DOC-docs-restructure` pada 2026-11-02. Nilainya:

- **Sesuai**: keputusan terlihat di kode atau konfigurasi.
- **Sebagian**: sebagian sudah ada, sebagian belum.
- **Belum**: belum ada di kode. Catatan merujuk modul atau task yang memuatnya.
- **—**: ADR Proposed. Belum mengikat dan tidak diverifikasi.

Aturan:

- ADR berstatus Accepted wajib punya status implementasi di tabel ini.
- ADR yang belum diimplementasikan ditandai Belum dan merujuk modul atau task.
- Status implementasi tidak mengubah keputusan. Hanya Tech Lead yang mengubah status ADR.

ADR berstatus Proposed belum mengikat. Keputusan diambil Tech Lead, lalu status diubah menjadi Accepted dan diberi Technical Decision ID.
