# Developer Onboarding & Local Setup Guide

Dokumen ini menjelaskan langkah-langkah menyiapkan local environment Staffora untuk engineer baru.

---

## 1. System Prerequisites

Pastikan perangkat lokal Anda telah terinstall:
- **Node.js**: v24 LTS (direkomendasikan) atau Node.js v20+
- **npm**: v10+ (terbawa bersama Node.js)
- **Docker Desktop** / Docker Engine & Docker Compose
- **Git**

---

## 2. Inisialisasi Repositori

```bash
# Clone repositori
git clone <repository-url>
cd staffora

# Install dependencies untuk seluruh monorepo
npm install
```

---

## 3. Konfigurasi Environment Variable

Salin template environment untuk backend dan frontend:

```bash
# Backend environment
cp apps/api/.env.example apps/api/.env

# Frontend environment
cp apps/web/.env.example apps/web/.env
```

Pastikan variabel di `apps/api/.env` sesuai:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://staffora:staffora_local@localhost:5432/staffora
SESSION_SECRET=local-development-session-secret-must-be-long-and-random-32char
```

Dan variabel di `apps/web/.env` sesuai:
```env
VITE_API_BASE_URL=/api/v1
```

---

## 4. Menjalankan Database PostgreSQL

Staffora menggunakan PostgreSQL 18. Jalankan database melalui Docker Compose:

```bash
docker compose up -d db
```

Untuk memverifikasi database sehat:
```bash
docker compose ps
```

---

## 5. Menjalankan Database Migration & Seed

Jalankan Prisma migration untuk membuat tabel, relasi, dan constraint:

```bash
npm run db:migrate -w @staffora/api
```

Lakukan seeding data master (department, job roles, skills, admin, PM, RM, employee test data):

```bash
npm run db:seed -w @staffora/api
```

---

## 6. Menjalankan Aplikasi

Jalankan dev server frontend dan backend:

```bash
# Menjalankan kedua aplikasi secara bersamaan
npm run dev

# Atau jalankan di dua terminal terpisah:
# Terminal 1 (API):
npm run dev:api

# Terminal 2 (Web SPA):
npm run dev:web
```

Akses aplikasi di browser:
- **Web App**: [http://localhost:5173](http://localhost:5173)
- **API Base**: [http://localhost:3000/api/v1](http://localhost:3000/api/v1)
- **API Health Live**: [http://localhost:3000/api/v1/health/live](http://localhost:3000/api/v1/health/live)
- **API Health Ready**: [http://localhost:3000/api/v1/health/ready](http://localhost:3000/api/v1/health/ready)

---

## 7. Akun Login untuk Testing Lokal

Gunakan akun seeded berikut untuk menguji role-based access:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@staffora.internal` | `StafforaAdmin2026!` |
| **Project Manager** | `pm@staffora.internal` | `StafforaPM2026!` |
| **Resource Manager** | `rm@staffora.internal` | `StafforaRM2026!` |
| **Employee** | `employee@staffora.internal` | `StafforaEmp2026!` |
