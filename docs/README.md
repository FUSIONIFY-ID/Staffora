# Staffora — Engineering Documentation

Dokumentasi teknis resmi dan executable contract untuk implementasi Staffora MVP v1.0.

## 📚 Dokumen Induk
- **PRD Source of Truth**: `Staffora — Product Requirements, User Stories & Acceptance Criteria (MVP v1.0)`
- **TSD Source of Truth**: `Staffora — Technical Specification Document (MVP v1.0)`

---

## 🗂️ Direktori Dokumentasi

### 1. [Architecture (`docs/architecture/`)](architecture/overview.md)
- [`overview.md`](architecture/overview.md): System topology, monorepo layout, domain module boundaries, Express middleware chain, dan prinsip arsitektur.
- [`decisions/`](architecture/decisions/): Architecture Decision Records (ADR-001 hingga ADR-010) yang mengunci keputusan TD-001 sampai TD-010.

### 2. [Database (`docs/database/`)](database/erd.md)
- [`erd.md`](database/erd.md): Authoritative Entity Relationship Diagram (ERD), spesifikasi 11 core tables, lifecycle rules, dan PostgreSQL constraints.
- [`schema.dbml`](database/schema.dbml): DBML representation untuk visualisasi tool modeling database.

### 3. [API Specification (`docs/api/`)](api/openapi.yaml)
- [`openapi.yaml`](api/openapi.yaml): OpenAPI 3.1 specification untuk seluruh endpoint `/api/v1` (Auth, Workforce, Skills, Projects, Staffing, Allocations, Capacity, Dashboard, Health).

### 4. [Development Guides (`docs/development/`)](development/local-setup.md)
- [`local-setup.md`](development/local-setup.md): Panduan penyiapan local development environment menggunakan Docker Compose & npm workspaces.
- [`coding-conventions.md`](development/coding-conventions.md): Standar arsitektur module, penamaan, error handling, dan rules per layer.
- [`git-workflow.md`](development/git-workflow.md): Git branching model, conventional commits, dan PR review checklist.
- [`testing-guide.md`](development/testing-guide.md): Panduan testing backend & frontend, fixture strategy, dan 15 mandatory capacity scenarios.

### 5. [Operations & Runbooks (`docs/runbooks/`)](runbooks/deployment.md)
- [`deployment.md`](runbooks/deployment.md): Prosedur deployment staging dan production menggunakan single-VM & Docker Compose.
- [`rollback.md`](runbooks/rollback.md): Prosedur rollback cepat aplikasi dan mitigasi database migration.
- [`troubleshooting.md`](runbooks/troubleshooting.md): Diagnosis error umum, deadlock capacity locking, dan session debugging.
