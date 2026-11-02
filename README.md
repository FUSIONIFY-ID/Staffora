# Staffora — Project Resource Allocation & Workforce Planning System

**Status:** Approved for Development — MVP v1.0 Foundation (Day-1 Baseline)

Staffora adalah sistem internal perusahaan untuk mengelola visibilitas skill karyawan, ketersediaan (_availability_), beban kerja (_workload_), kebutuhan staffing proyek (_staffing requirements_), serta alokasi sumber daya (_resource allocation_) tanpa melebihi batas kapasitas kerja karyawan (_capacity conflict prevention_).

---

## 🏛️ Architecture & Tech Stack

Sistem dibangun menggunakan arsitektur **Modular Monolith** dalam satu repositori (_npm Workspaces_):

| Area               | Teknologi                                      | Keterangan                                               |
| :----------------- | :--------------------------------------------- | :------------------------------------------------------- |
| **Monorepo**       | npm Workspaces                                 | `apps/web`, `apps/api`; `docs/` berisi dokumentasi       |
| **Frontend**       | React 19 + Vite 8 + TypeScript Strict          | Internal SPA, Desktop-first (1440px / 1280px)            |
| **Styling & UI**   | Tailwind CSS 4 (konvensi shadcn/ui via `components.json`) | Design tokens, glassmorphism, responsive      |
| **State & Forms**  | TanStack Query 5 + React Hook Form + Zod 4     | Server state caching & typed form validation             |
| **Backend**        | Node.js 24 LTS + Express.js 5 + TypeScript ESM | REST API versioned di `/api/v1`                          |
| **Database & ORM** | PostgreSQL 18 + Prisma ORM 7                   | UUID v4 primary keys, `@prisma/adapter-pg`               |
| **Authentication** | Server-side Session (`connect-pg-simple`)      | Cookie `staffora.sid`, HttpOnly, CSRF synchronizer token |
| **Testing**        | Vitest, Supertest, React Testing Library       | Unit tests, mandatory capacity scenarios, API tests      |
| **Quality Gate**   | Git hook `pre-push` + GitHub Actions           | 4 gate: lint, typecheck, test, build                     |
| **Infrastructure** | Docker + Docker Compose, Nginx                 | Local development & single-VM deployment                 |

---

## 📁 Repository Structure

```text
staffora/
├── apps/
│   ├── web/                     # Frontend SPA (React 19 + Vite 8 + Tailwind 4)
│   │   ├── public/              # Brand assets & logos
│   │   ├── src/
│   │   │   ├── api/             # HTTP client & generated API contracts
│   │   │   ├── app/             # Router, layouts, and providers
│   │   │   ├── components/ui/   # Reusable UI component library
│   │   │   └── features/        # Feature modules aligned with Sprint scope
│   │   └── tests/               # Frontend unit & component tests
│   └── api/                     # Backend Modular Monolith (Express.js 5 + Prisma 7)
│       ├── prisma/              # Prisma schema, migrations & seed
│       ├── src/
│       │   ├── common/          # Auth, database, errors, http, logging, validation
│       │   └── modules/         # Domain modules per TSD Section 4 & 7.2
│       └── tests/               # Backend tests (capacity, auth, health)
├── docs/                        # Engineering documentation (mulai dari docs/README.md)
│   ├── architecture/            # Overview, modules/, dan ADR-001 s.d. ADR-015 (decisions/)
│   ├── api/                     # OpenAPI 3.1, konvensi API, katalog error
│   ├── database/                # ERD, DBML, index & constraint, kebijakan migrasi
│   ├── security/                # Autentikasi & sesi, matriks akses peran (RBAC)
│   ├── tasks/                   # Task breakdown per story (dan cross-cutting/)
│   ├── quality/                 # Traceability AC ke endpoint dan tes
│   ├── ui-specs/                # Design system, glosarium UI, peta layar Figma
│   ├── development/             # Setup, konvensi, Git workflow, panduan tes
│   ├── runbooks/                # Deployment, rollback, troubleshooting, backup & restore
│   └── templates/               # Template ADR dan runbook
├── .githooks/                   # Hook Git: pre-push (4 gate) dan commit-msg
├── .github/workflows/           # CI/CD pipelines (GitHub Actions)
├── docker-compose.yml           # Layanan lokal: db (host port 5433), api, web
├── docker-compose.dev.yml       # Overlay dev untuk npm run stack:up
├── .nvmrc                       # Versi Node.js (24)
└── package.json                 # Root monorepo scripts & dependencies
```

---

## 🚀 Quick Start (Panduan Mulai dari Nol)

Panduan langkah demi langkah untuk menjalankan Staffora di mesin lokal Anda dari awal.

### 1. Prasyarat Sistem

Pastikan perangkat lokal Anda telah terpasang:

- **Git**
- **Node.js 24** (sesuai `engines` di `package.json` dan `.nvmrc`). Jika memakai nvm di macOS atau Linux, jalankan `nvm use` di folder project.
- **npm** (ikut terpasang bersama Node.js)
- **Docker Desktop** (Engine & Docker Compose aktif)

---

### 2. Clone Repositori & Masuk ke Folder Project

Buka Terminal / PowerShell dan jalankan:

```bash
git clone <URL_REPOSITORY_STAFFORA>
cd staffora
```

---

### 3. Aktifkan Hook Git (sekali per clone)

```bash
git config core.hooksPath .githooks
```

Setelah ini, setiap `git push` dari clone ini menjalankan `lint`, `typecheck`, `test`, dan `build` lebih dulu. Push dibatalkan jika salah satu gagal. Karena `test` membutuhkan database, jalankan langkah 6 dan 7, serta siapkan database uji di langkah 11, sebelum push.

Hook `commit-msg` di folder yang sama menghapus trailer `Co-Authored-By: Claude` dari pesan commit.

---

### 4. Install Seluruh Dependensi Monorepo

Install dependensi untuk seluruh aplikasi (frontend `apps/web`, backend `apps/api`, dan shared packages):

```bash
npm install
```

---

### 5. Konfigurasi Environment Variables (`.env`)

Salin template environment untuk backend:

**Linux / macOS / Git Bash:**

```bash
cp apps/api/.env.example apps/api/.env
```

**Windows PowerShell:**

```powershell
Copy-Item apps/api/.env.example apps/api/.env
```

> **Catatan:** Frontend tidak membutuhkan file `.env` untuk pengembangan lokal. Nilai default `apps/api/.env.example` sudah sesuai untuk database Docker, yang memakai **port 5433** di mesin Anda. Port 5433 dipilih supaya tidak bentrok dengan PostgreSQL lokal di 5432. Jika `apps/api/.env` Anda masih memakai `localhost:5432` dari versi lama, ubah ke `5433`.

---

### 6. Jalankan Database (PostgreSQL 18 via Docker)

Nyalakan container PostgreSQL 18 di background:

```bash
docker compose up -d db
```

_Pastikan container berjalan dengan memeriksa:_

```bash
docker compose ps
```

Container memakai host port **5433** (di dalam container tetap 5432).

---

### 7. Migrasi Skema Database & Isi Data Awal (Seed)

Jalankan migrasi Prisma untuk membuat tabel-tabel di database, lalu masukkan data awal:

```bash
# 1. Jalankan migrasi database
npm run db:migrate -w @staffora/api

# 2. Masukkan data awal untuk pengembangan (akun pengujian: lihat langkah 10)
npm run db:seed -w @staffora/api
```

Seed hanya untuk pengembangan. Perintah seed juga mencetak password akun ke terminal sampai S1-SEC-05 selesai.

---

### 8. Jalankan Server Development

Jalankan backend dan frontend di dua terminal terpisah. `npm run dev` di root saat ini hanya menjalankan frontend, jadi API tidak ikut naik.

```bash
# Terminal 1 - Backend API (Port 3000):
npm run dev:api

# Terminal 2 - Frontend Web SPA (Port 5173):
npm run dev:web
```

Alternatif — seluruh stack dalam Docker (hot reload aktif untuk API dan Web):

```bash
npm run stack:up
```

Perintah ini membangun image `dev` (target) dan menjalankan `db` + `api` + `web` dengan bind-mount source sehingga setiap edit langsung ter-apply. Berhentikan stack dengan `npm run stack:down`.

---

### 9. Buka Aplikasi di Browser

- **Frontend SPA**: [http://localhost:5173](http://localhost:5173)
- **Backend API** (base path): `http://localhost:3000/api/v1`
- **Health Check API**: [http://localhost:3000/api/v1/health/ready](http://localhost:3000/api/v1/health/ready)

---

### 10. Akun Pengujian Default (Hasil Seed)

Gunakan akun berikut untuk login dan menguji fungsionalitas berdasarkan peran (RBAC). **Password tidak ditulis di dokumen ini.** Minta ke Tech Lead. Sumber password seed belum diputuskan, lihat [`docs/tasks/cross-cutting/security.md`](docs/tasks/cross-cutting/security.md) (S1-SEC-05).

| Peran (Role)         | Email                        | Wewenang & Lingkup Kerja                             |
| :------------------- | :--------------------------- | :--------------------------------------------------- |
| **System Admin**     | `admin@staffora.internal`    | Kelola Master Data, User, dan Department             |
| **Project Manager**  | `pm@staffora.internal`       | Kelola Proyek, Staffing Request, Alokasi Tim         |
| **Resource Manager** | `rm@staffora.internal`       | Review Kapasitas Karyawan, Resolusi Konflik Staffing |
| **Employee**         | `employee@staffora.internal` | Profil Pribadi, Skill, Jadwal Alokasi Proyek         |

---

### 11. Validasi & Pengujian Kode

Sebelum membuat commit atau membuka Pull Request, jalankan pengecekan kualitas kode. Hook `pre-push` (langkah 3) menjalankan urutan yang sama sebelum setiap push.

Tes API memakai `apps/api/.env.test` bila file itu ada, dan tidak boleh memakai database development. Siapkan database uji dulu: salin `apps/api/.env.test.example` ke `apps/api/.env.test`, isi `DATABASE_URL` dengan database uji, lalu jalankan migrasi dan seed ke database itu. Langkahnya ada di [`docs/development/testing-guide.md`](docs/development/testing-guide.md).

```bash
# 1. Periksa linting (ESLint)
npm run lint

# 2. Periksa tipe TypeScript di seluruh monorepo
npm run typecheck

# 3. Jalankan seluruh automated tests (Backend & Frontend)
npm test

# 4. Verifikasi production build
npm run build
```

---

### 12. Alur Kerja Git & Aturan Khusus Developer

Semua developer junior (**Wahyu & Nabil** di Frontend, **Saiful & Jundy** di Backend, **Fikri** di QA/DevOps) **WAJIB** mengikuti panduan Git dari Tech Lead (**Arya Isnaidi**):

1. **Wajib sinkronisasi dari branch `dev` menggunakan rebase:**

   ```bash
   git checkout dev
   git pull --rebase origin dev
   ```

2. **Buat branch baru dengan format baku:**

   ```bash
   git checkout -b [FE/BE/DB/QA]-S<SprintNumber>-[Kode]-subjudultask
   ```

   _Contoh:_
   - `FE-S1-US01-login-screen`
   - `BE-S1-US01-session-auth-endpoints`
   - `DB-S1-US01-user-sessions-schema`
   - `QA-S1-US01-verify-auth-session-flow`

3. **Aturan Commit & PR:**
   - Dilarang keras push langsung ke branch `dev` atau `main`.
   - Dilarang keras menggunakan `git push --force`.
   - Dilarang melewati hook dengan `git push --no-verify` tanpa keputusan Tech Lead.
   - Commit tidak boleh memuat trailer `Co-Authored-By: Claude`. CI menolaknya di PR (job `commit-hygiene`). Atribusi AI lain belum diperiksa CI.
   - Target Pull Request (PR) **wajib ke branch `dev`**, bukan `main`.
   - Satu story per PR, maksimal sekitar 20 file berubah. Lihat [`docs/development/git-workflow.md`](docs/development/git-workflow.md).
   - Gunakan template [`.github/pull_request_template.md`](.github/pull_request_template.md).
   - Task hanya dikerjakan jika memenuhi Definition of Ready, lihat [`docs/tasks/README.md`](docs/tasks/README.md).
   - Batas panjang file produksi adalah **maksimal 300 baris** (dekomposisi mulai pada 250 baris).

---

## 📖 Documentation Index

Mulai dari [`docs/README.md`](docs/README.md), yang berisi peta folder dan status dokumen utama.

- [Architecture Overview](docs/architecture/overview.md)
- [Modul Backend](docs/architecture/modules/)
- [Architecture Decision Records (ADR-001 s.d. ADR-015)](docs/architecture/decisions/README.md)
- [OpenAPI 3.1 Specification](docs/api/openapi.yaml), [Konvensi API](docs/api/conventions.md), [Katalog Error](docs/api/error-catalog.md)
- [Database ERD](docs/database/erd.md), [Schema DBML](docs/database/schema.dbml), [Index & Constraint](docs/database/indexes.md), [Kebijakan Migrasi](docs/database/migration-policy.md)
- [Autentikasi & Sesi](docs/security/authentication.md), [Matriks Akses Peran](docs/security/rbac-matrix.md)
- [Task Breakdown](docs/tasks/README.md), [Traceability AC](docs/quality/traceability.md)
- [Glosarium UI](docs/ui-specs/glossary.md), [Peta Layar Figma](docs/ui-specs/figma-screen-map.md)
- [Developer Setup Guide](docs/development/local-setup.md), [Coding Conventions](docs/development/coding-conventions.md), [Git Workflow](docs/development/git-workflow.md), [Testing Strategy](docs/development/testing-guide.md)
- [Coding Standard](docs/CODING_STANDARD.md), [Code Review Checklist](docs/CODE_REVIEW_CHECKLIST.md)
- [Deployment Runbook](docs/runbooks/deployment.md), [Rollback Runbook](docs/runbooks/rollback.md), [Troubleshooting](docs/runbooks/troubleshooting.md), [Backup & Restore](docs/runbooks/backup-restore.md)
- Instruksi untuk agen AI: [CLAUDE.md](CLAUDE.md), [AGENTS.md](AGENTS.md), [GEMINI.md](GEMINI.md)
