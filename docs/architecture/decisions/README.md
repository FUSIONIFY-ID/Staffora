# Architecture Decision Records

Setiap keputusan arsitektur yang mengikat lintas modul dicatat sebagai ADR. Format mengikuti [template](../../templates/adr.md). Keputusan yang berubah setelah baseline harus punya ADR baru. ADR lama tidak dihapus, statusnya diubah menjadi `Superseded`.

| ADR | Judul | Status | TD |
| --- | --- | --- | --- |
| [001](adr-001-modular-monolith.md) | Modular monolith | Accepted | TD-001 |
| [002](adr-002-monorepo-workspaces.md) | Monorepo dengan npm Workspaces | Accepted | TD-002 |
| [003](adr-003-react-vite-spa.md) | React 19 dan Vite 8 untuk SPA | Accepted | TD-003 |
| [004](adr-004-nodejs-express-esm.md) | Node.js 24 LTS dan Express 5 dengan ESM | Accepted | TD-004 |
| [005](adr-005-postgres-prisma.md) | PostgreSQL 18 dan Prisma ORM 7 | Accepted | TD-005 |
| [006](adr-006-session-auth.md) | Session cookie server-side di PostgreSQL | Accepted | TD-006 |
| [007](adr-007-deployment-topology.md) | Nginx dan Docker Compose di satu VM Linux untuk MVP | Accepted | TD-007 |
| [008](adr-008-ci-cd-pipeline.md) | GitHub Actions dan GHCR | Accepted | TD-008 |
| [009](adr-009-allocation-concurrency-row-lock.md) | Serialisasi mutasi alokasi dengan row lock karyawan | Accepted | TD-009 |
| [010](adr-010-lean-architecture-no-queue.md) | Tanpa Redis, queue, atau object storage di MVP | Accepted | TD-010 |
| [011](adr-011-figma-design-system-light-mode.md) | Design system Figma dan light mode saja | Accepted | TD-011 |
