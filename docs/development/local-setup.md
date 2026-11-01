# Developer Onboarding & Local Setup Guide

Dokumen ini menjelaskan langkah-langkah menyiapkan local environment Staffora untuk engineer baru.

---

## 1. System Prerequisites

Pastikan perangkat lokal Anda telah terinstall:

- **Node.js**: 24 (sesuai `engines` di `package.json` dan `.nvmrc`)
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
DATABASE_URL=postgresql://staffora:<password-lokal>@localhost:5433/staffora
SESSION_SECRET=<session-secret>
```

Ganti `<password-lokal>` dengan password database lokal, yaitu nilai yang sama dengan `POSTGRES_PASSWORD` di `docker-compose.yml`. Ganti `<session-secret>` dengan nilai minimal 8 karakter yang berisi satu huruf kapital dan satu karakter khusus.

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

> **Catatan port:** container `db` memakai host port `5433` (`"5433:5432"` di `docker-compose.yml`), supaya tidak bentrok dengan PostgreSQL lokal di `5432`. Jika mesin Anda punya PostgreSQL lokal di `5432`, container tetap di `5433` dan `DATABASE_URL` di `apps/api/.env` harus menunjuk ke `5433`.

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

Jalankan backend dan frontend di dua terminal terpisah dengan `npm run dev:api` dan `npm run dev:web`. `npm run dev` di root menjalankan skrip `dev` setiap workspace secara berurutan, jadi tidak menjalankan keduanya bersamaan.

```bash
# Terminal 1 (API):
npm run dev:api

# Terminal 2 (Web SPA):
npm run dev:web
```

Alternatif — seluruh stack dalam Docker (hot reload aktif untuk API dan Web):

```bash
npm run stack:up
```

Perintah ini membangun image `dev` (target) dan menjalankan `db` + `api` + `web` dengan bind-mount
source sehingga setiap edit langsung ter-apply. Berhentikan stack dengan `npm run stack:down`.

Akses aplikasi di browser:

- **Web App**: [http://localhost:5173](http://localhost:5173)
- **API Base**: [http://localhost:3000/api/v1](http://localhost:3000/api/v1)
- **API Health Live**: [http://localhost:3000/api/v1/health/live](http://localhost:3000/api/v1/health/live)
- **API Health Ready**: [http://localhost:3000/api/v1/health/ready](http://localhost:3000/api/v1/health/ready)

---

## 7. Akun Login untuk Testing Lokal

Gunakan akun seeded berikut untuk menguji role-based access:

| Role                 | Email                        | Password             |
| :------------------- | :--------------------------- | :------------------- |
| **Admin**            | `admin@staffora.internal`    | `StafforaAdmin2026!` |
| **Project Manager**  | `pm@staffora.internal`       | `StafforaPM2026!`    |
| **Resource Manager** | `rm@staffora.internal`       | `StafforaRM2026!`    |
| **Employee**         | `employee@staffora.internal` | `StafforaEmp2026!`   |
