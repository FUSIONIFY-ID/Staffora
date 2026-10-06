# Staffora — Project Resource Allocation & Workforce Planning System

**Status:** Approved for Development — MVP v1.0 Foundation (Day-1 Baseline)

Staffora adalah sistem internal perusahaan untuk mengelola visibilitas skill karyawan, ketersediaan (_availability_), beban kerja (_workload_), kebutuhan staffing proyek (_staffing requirements_), serta alokasi sumber daya (_resource allocation_) tanpa melebihi batas kapasitas kerja karyawan (_capacity conflict prevention_).

---

## 🏛️ Architecture & Tech Stack

Sistem dibangun menggunakan arsitektur **Modular Monolith** dalam satu repositori (_npm Workspaces_):

| Area               | Teknologi                                      | Keterangan                                               |
| :----------------- | :--------------------------------------------- | :------------------------------------------------------- |
| **Monorepo**       | npm Workspaces                                 | `apps/web`, `apps/api`, `docs/`                          |
| **Frontend**       | React 19 + Vite 8 + TypeScript Strict          | Internal SPA, Desktop-first (1440px / 1280px)            |
| **Styling & UI**   | Tailwind CSS 4 + shadcn/ui                     | Design tokens, glassmorphism, responsive                 |
| **State & Forms**  | TanStack Query 5 + React Hook Form + Zod 4     | Server state caching & typed form validation             |
| **Backend**        | Node.js 24 LTS + Express.js 5 + TypeScript ESM | REST API versioned di `/api/v1`                          |
| **Database & ORM** | PostgreSQL 18 + Prisma ORM 7                   | UUID v4 primary keys, `@prisma/adapter-pg`               |
| **Authentication** | Server-side Session (`connect-pg-simple`)      | Cookie `staffora.sid`, HttpOnly, CSRF synchronizer token |
| **Testing**        | Vitest, Supertest, React Testing Library       | Unit tests, mandatory capacity scenarios, API tests      |
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
├── docs/                        # Authoritative engineering documentation
│   ├── architecture/            # System overview & ADRs (ADR-001 - ADR-010)
│   ├── api/                     # OpenAPI 3.1 contract (openapi.yaml)
│   ├── database/                # Database ERD (erd.md) & DBML (schema.dbml)
│   ├── development/             # Setup, coding conventions, testing guide
│   └── runbooks/                # Deployment, rollback, troubleshooting
├── .github/workflows/           # CI/CD pipelines (GitHub Actions)
├── docker-compose.yml           # Local dev services (web, api, postgres)
└── package.json                 # Root monorepo scripts & dependencies
```

---

## 🚀 Quick Start (Panduan Mulai dari Nol)

Panduan langkah demi langkah untuk menjalankan Staffora di mesin lokal Anda dari awal.

### 1. Prasyarat Sistem

Pastikan perangkat lokal Anda telah terpasang:

- **Git**
- **Node.js**: v24 LTS (atau minimal v20+)
- **npm**: v10+ (otomatis terpasang bersama Node.js)
- **Docker Desktop** (Engine & Docker Compose aktif)

---

### 2. Clone Repositori & Masuk ke Folder Project

Buka Terminal / PowerShell dan jalankan:

```bash
git clone <URL_REPOSITORY_STAFFORA>
cd staffora
```

---

### 3. Install Seluruh Dependensi Monorepo

Install dependensi untuk seluruh aplikasi (frontend `apps/web`, backend `apps/api`, dan shared packages):

```bash
npm install
```

---

### 4. Konfigurasi Environment Variables (`.env`)

Salin file template environment ke masing-masing aplikasi:

**Linux / macOS / Git Bash:**

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

**Windows PowerShell:**

```powershell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
```

> **Catatan:** Nilai default pada `.env.example` sudah siap pakai untuk kebutuhan local development dengan database Docker.

---

### 5. Jalankan Database (PostgreSQL 18 via Docker)

Nyalakan container PostgreSQL 18 di background:

```bash
docker compose up -d db
```

_Pastikan container berjalan sehat dengan memeriksa:_

```bash
docker compose ps
```

---

### 6. Migrasi Skema Database & Isi Data Awal (Seed)

Jalankan migrasi Prisma untuk membuat tabel-tabel di database, lalu masukkan data awal (master data & akun uji coba):

```bash
# 1. Jalankan migrasi database
npm run db:migrate -w @staffora/api

# 2. Masukkan data awal (Department, Role, Skill, Akun Pengujian)
npm run db:seed -w @staffora/api
```

---

### 7. Jalankan Server Development

Anda dapat menjalankan frontend dan backend secara bersamaan dalam satu terminal:

```bash
npm run dev
```

Atau jika ingin menjalankan di dua terminal terpisah:

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

Perintah ini membangun image `dev` (target) dan menjalankan `db` + `api` + `web` dengan bind-mount
source sehingga setiap edit langsung ter-apply. Berhentikan stack dengan `npm run stack:down`.

---

### 8. Buka Aplikasi di Browser

- **Frontend SPA**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3000/api/v1](http://localhost:3000/api/v1)
- **Health Check API**: [http://localhost:3000/api/v1/health/ready](http://localhost:3000/api/v1/health/ready)

---

### 9. Akun Pengujian Default (Hasil Seed)

Gunakan akun seeded berikut untuk login dan menguji fungsionalitas berdasarkan peran (RBAC):

| Peran (Role)         | Email                        | Password             | Wewenang & Lingkup Kerja                             |
| :------------------- | :--------------------------- | :------------------- | :--------------------------------------------------- |
| **System Admin**     | `admin@staffora.internal`    | `StafforaAdmin2026!` | Kelola Master Data, User, Department, Audit Log      |
| **Project Manager**  | `pm@staffora.internal`       | `StafforaPM2026!`    | Kelola Proyek, Staffing Request, Alokasi Tim         |
| **Resource Manager** | `rm@staffora.internal`       | `StafforaRM2026!`    | Review Kapasitas Karyawan, Resolusi Konflik Staffing |
| **Employee**         | `employee@staffora.internal` | `StafforaEmp2026!`   | Profil Pribadi, Skill, Jadwal Alokasi Proyek         |

---

### 10. Validasi & Pengujian Kode

Sebelum membuat commit atau membuka Pull Request, jalankan pengecekan kualitas kode:

```bash
# 1. Periksa tipe TypeScript di seluruh monorepo
npm run typecheck

# 2. Periksa formatting & linting
npm run lint

# 3. Jalankan seluruh automated tests (Backend & Frontend)
npm test

# 4. Verifikasi production build
npm run build
```

---

### 11. Alur Kerja Git & Aturan Khusus Developer

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
   - Target Pull Request (PR) **wajib ke branch `dev`**, bukan `main`.
   - Batas panjang file produksi adalah **maksimal 300 baris** (dekomposisi mulai pada 250 baris).

---

## 📖 Documentation Index

- [Architecture Overview](docs/architecture/overview.md)
- [Architecture Decision Records (ADRs)](docs/architecture/decisions/)
- [Database ERD & Constraints](docs/database/erd.md)
- [Database Schema DBML](docs/database/schema.dbml)
- [OpenAPI 3.1 Specification](docs/api/openapi.yaml)
- [Developer Onboarding & Setup Guide](docs/development/local-setup.md)
- [Coding Conventions & Module Standards](docs/development/coding-conventions.md)
- [Testing Strategy & Mandatory Scenarios](docs/development/testing-guide.md)
- [Deployment Runbook](docs/runbooks/deployment.md)
- [Rollback Runbook](docs/runbooks/rollback.md)
