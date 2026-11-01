# Runbook: Deployment Staffora ke Staging dan Production

- **Pemilik**: Fikri (QA & DevOps) untuk pipeline dan Docker. Promosi rilis production disetujui Arya Isnaidi (Tech Lead). Sumber: `CLAUDE.md`, bagian Team and Work Model.
- **Kapan dipakai**: Setelah merge ke `main` (staging) atau setelah tag `v*.*.*` (production), dan saat rollout manual ke VM. Di repo, workflow hanya membangun image. Langkah rollout ke VM belum ada di repo (lihat "Belum diverifikasi").
- **Risiko**: Salah langkah bisa membuat login tidak bertahan, membuka API langsung di port 3000, atau memakai secret placeholder. Selisih utama dengan runbook lama:
  - Workflow tidak push image, tidak menjalankan migrasi, tidak rollout, dan tidak health check (`.github/workflows/deploy-staging.yml:21-22`, `.github/workflows/deploy-production.yml:22-23`).
  - Staging dan production memakai overlay dan `NODE_ENV` yang sama (lihat 1.3).
  - Overlay production tidak menutup port API dan memakai fallback `SESSION_SECRET` (lihat 1.4).
- **Terakhir diuji**: Belum pernah diuji dari dokumen ini. Repo tidak punya catatan run deployment, dan `gh` tidak tersedia di mesin ini, jadi riwayat GitHub Actions belum dicek. Perubahan terakhir pada workflow dan compose menurut git log: 2026-10-17 (`799f15d`).

## Prasyarat

- Akses baca ke repo dan riwayat GitHub Actions. Akses ke VM target (nama host, akun, kunci) belum ada di repo.
- Overlay production menyatakan bahwa secret production, TLS, dan prosedur deployment perlu persetujuan (`docker-compose.prod.yml:1`). Jalankan rollout hanya setelah persetujuan itu ada.
- TLS di depan Nginx. Belum ada di repo (lihat 1.1).
- Docker Compose yang mendukung tag `!reset` di overlay (`docker-compose.prod.yml:4`). Versi minimum belum diverifikasi.
- Nilai `SESSION_SECRET` (minimal 32 karakter, `apps/api/src/config/env.ts:10`) dan `DATABASE_URL` sudah disiapkan di VM. Nama variabel ada di 1.4. Nilainya tidak ditulis di dokumen ini.

### 1.1 Environment Mode untuk Staging dan Production

- `NODE_ENV` hanya menerima `development`, `test`, dan `production` (`apps/api/src/config/env.ts:5-7`). Tidak ada nilai `staging`.
- Compose menetapkan `NODE_ENV=production` untuk service api (`docker-compose.yml:22`). Image api juga mengatur nilai yang sama (`apps/api/Dockerfile:20`). Jangan menurunkan `NODE_ENV` untuk mengatasi masalah HTTP, karena itu mematikan aturan keamanan.
- Dengan `NODE_ENV=production`, cookie `staffora.sid` diberi flag `Secure` (`apps/api/src/common/auth/session.ts:40, 49`) dan `trust proxy` diset ke 1 hop (`apps/api/src/app.ts:51-55`).
- Akibatnya, akses lewat HTTP biasa tidak mendapat cookie sesi yang bisa dipakai. Gejala tepatnya belum diverifikasi di repo (lihat "Belum diverifikasi").
- Proxy di depan API harus mengirim `X-Forwarded-Proto: https`. `apps/web/nginx.conf:5` hanya mengirim `Host` dan `X-Forwarded-For`. Header `X-Forwarded-Proto` harus ditambahkan oleh proxy TLS di depan, dan proxy itu belum ada di repo.

### 1.2 Topologi container (ADR-007)

| Service | Dibangun dari | Port di container | Port publish | Sumber |
|---|---|---|---|---|
| `web` | `apps/web/Dockerfile` (nginx:alpine) | 80 | 8080 | `docker-compose.yml:41-46`, `apps/web/Dockerfile:17-20` |
| `api` | `apps/api/Dockerfile` (node:24-alpine) | 3000 | 3000 | `docker-compose.yml:17-27`, `apps/api/Dockerfile:18-26` |
| `db` | Image `postgres:18`, volume `staffora_pgdata` | 5432 | 5432 di base, di-reset di prod | `docker-compose.yml:2-11`, `docker-compose.prod.yml:4` |

- `web` menyajikan SPA dan meneruskan `/api/` ke `http://api:3000` (`apps/web/nginx.conf:2, 5`).
- ADR-007 menyebut Nginx juga mengakhiri TLS (`docs/architecture/decisions/adr-007-deployment-topology.md:15`). Di repo, nginx hanya listen di port 80 (`apps/web/nginx.conf:2`), dan tidak ada konfigurasi TLS.

### 1.3 Staging dan production

| Aspek | Staging | Production |
|---|---|---|
| Workflow | `.github/workflows/deploy-staging.yml` | `.github/workflows/deploy-production.yml` |
| Pemicu | Push ke `main` (`:3-6`), atau manual | Push tag `v*.*.*` (`:3-7`), atau manual |
| Yang dijalankan | Checkout, setup Buildx, build image (`:21`) | Sama (`:22`) |
| Compose file | `docker-compose.yml` + `docker-compose.prod.yml` | Sama |
| `NODE_ENV` | `production` | `production` |
| GitHub Environment dan approval | Belum ada di repo | Belum ada di repo (workflow tidak punya `environment:`) |
| Host VM | Belum ada di repo | Belum ada di repo |

- Di repo, staging dan production hanya berbeda pada pemicu workflow. Tidak ada overlay staging terpisah.
- Tag production tidak memicu CI. `ci.yml` hanya berjalan untuk push ke `main` dan `dev`, serta pull request (`.github/workflows/ci.yml:3-7`).

### 1.4 Variabel dan secret (nama saja)

| Nama | Dibaca di | Sumber saat ini | Catatan |
|---|---|---|---|
| `NODE_ENV` | `apps/api/src/config/env.ts:5` | `docker-compose.yml:22` | Di-set compose. `.env.example:5` berisi `development`, tetapi tidak dipakai compose. |
| `PORT` | `env.ts:8` | `docker-compose.yml:23` | Default 3000. |
| `DATABASE_URL` | `env.ts:9`, `apps/api/prisma.config.ts:6-8` | `docker-compose.yml:24`, nilai lokal tertulis di repo | Wajib di production (`env.ts:13-18`). Overlay prod tidak menggantinya. |
| `SESSION_SECRET` | `env.ts:10`, `session.ts:59-62` | `docker-compose.yml:25` dan `docker-compose.prod.yml:8` | Wajib di production (`env.ts:19-24`). Kedua file memberi fallback berupa placeholder yang tertulis di repo. Pastikan VM mengisi nilai sendiri. |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Service `db` | `docker-compose.yml:5-7` | Nilai lokal tertulis di repo. Overlay prod tidak menggantinya. |
| `VITE_API_BASE_URL` | Build web | `.env.example:11` | Tidak diteruskan ke build web. `.dockerignore:5` mengecualikan `**/.env`, dan compose tidak punya build arg. Tidak ada referensi di `apps/web/src`. |

- `.env.example` menyebut `apps/api/.env` dan `apps/web/.env` (file lokal, tidak di-commit, dibuat dari contoh). Interpolasi `${SESSION_SECRET}` di compose membaca file `.env` di folder proyek. Kedua lokasi itu berbeda, dan belum diuji di VM.
- Workflow deploy tidak memakai `secrets.*` dan tidak login ke registry. Nama secret GitHub, kredensial GHCR, dan kunci SSH belum ada di repo.

## Langkah

Workflow hanya menjalankan langkah 1. Langkah 2 sampai 6 adalah urutan rollout yang diminta, dengan status tiap langkah di repo.

| # | Langkah | Status di repo |
|---|---|---|
| 1 | Build image | Ada di workflow |
| 2 | Backup database | Belum ada di repo |
| 3 | `prisma migrate deploy` | Perintah ada untuk CI, belum untuk VM |
| 4 | Rollout container | File compose ada, perintah rollout belum ada |
| 5 | Readiness check | Endpoint ada, pemanggilan belum ada di repo |
| 6 | Smoke test | Manual, belum ada otomasi |

### Langkah 1. Build image (otomatis di workflow)

1. Staging: push ke `main` memicu `deploy-staging.yml`. Production: push tag `v*.*.*` memicu `deploy-production.yml`.
2. Workflow melakukan checkout, setup Buildx, lalu menjalankan `docker compose -f docker-compose.yml -f docker-compose.prod.yml build` (`deploy-staging.yml:21`, `deploy-production.yml:22`).
3. Pemeriksaan: step "Build Web & API Container Images" berstatus sukses.
4. Image tidak di-push. Tidak ada login registry atau `docker push` di workflow, dan image hilang saat job selesai.
5. Deploy workflow tidak punya `needs` ke CI. Pada push ke `main`, CI dan staging berjalan paralel, jadi build staging tidak menunggu hasil lint, typecheck, atau test.

### Langkah 2. Backup database (belum ada di repo)

1. Belum ada langkah backup di workflow, skrip, atau compose.
2. Perintah backup versi lama (`pg_dump` dari host ke `localhost`) tidak tersedia di overlay production, karena `docker-compose.prod.yml:4` mereset port 5432. Jangan dipakai tanpa verifikasi.
3. Pemeriksaan: belum ada kriteria di repo. Usulan, belum disetujui: file backup ada dan tidak kosong sebelum lanjut ke langkah 3.

### Langkah 3. Migrasi database (`prisma migrate deploy`)

1. Perintah di repo: `npm run db:migrate:deploy -w @staffora/api`. Perintah ini menjalankan `prisma migrate deploy` (`apps/api/package.json:16`) dan dipakai di CI (`.github/workflows/ci.yml:65-68`).
2. Di VM, perintah ini belum ada di repo. Image runtime api hanya menyalin `package*.json`, `node_modules`, `apps/api/package.json`, dan `apps/api/dist` (`apps/api/Dockerfile:21-24`). Folder `prisma/` dan `prisma.config.ts` tidak ikut, jadi `prisma migrate deploy` dari container runtime tidak menemukan schema dan migrations.
3. Produksi memakai `prisma migrate deploy`, bukan `db push` (`docs/database/migration-policy.md:10`).
4. Seed (`db:seed`) hanya ada di CI (`ci.yml:68`). Tidak ada langkah seed di deploy workflow.
5. Pemeriksaan: perintah selesai dengan exit code 0 tanpa error. Output sukses dari Prisma belum diverifikasi.
6. Jika gagal, jangan lanjut ke langkah 4 (lihat "Jika gagal").

### Langkah 4. Rollout container (perintah belum ada di repo)

1. Gunakan kedua file compose dengan urutan yang sama seperti workflow: `docker-compose.yml`, lalu `docker-compose.prod.yml`. Overlay saja tidak lengkap, karena service `api` dan `web` tidak punya `image` atau `build` di overlay (`docker-compose.prod.yml:5-10`).
2. Compose di repo tidak punya field `image` dengan tag versi. Rollback ke versi sebelumnya lewat variabel seperti di `docs/runbooks/rollback.md:12-15` tidak punya dasar di repo.
3. Compose menjalankan service sesuai dependensi: `db` lebih dulu, lalu `api` setelah `db` healthy, lalu `web` setelah `api` healthy (`docker-compose.yml:38-40, 53-55`).
4. Tidak ada konfigurasi zero-downtime. Setiap service punya satu replika dan port host tetap, jadi container lama berhenti saat diganti. Klaim "zero-downtime" di runbook lama tidak punya dasar di repo.
5. Saat container api berhenti, server menutup koneksi HTTP lalu session store (`apps/api/src/server.ts:12-22`).
6. Pemeriksaan: semua container berstatus `healthy`. Healthcheck ada di `docker-compose.yml:12-16` (db), `:28-37` (api), dan `:47-52` (web). Cara melihat status di VM belum ada di repo.

### Langkah 5. Readiness check

1. Endpoint dipasang di `/api/v1/health` (`apps/api/src/app.ts:130, 155`):
   - `GET /api/v1/health/live` (`apps/api/src/modules/health/health.routes.ts:6-11`): 200 dengan `status: "ok"` dan `timestamp`.
   - `GET /api/v1/health/ready` (`health.routes.ts:13-26`): 200 dengan `status: "ready"` dan `database: "connected"`. Jika database tidak terjangkau: 503 dengan `status: "unavailable"` dan `database: "disconnected"`.
2. Alamat yang bisa diuji: API di port 3000 (`docker-compose.yml:26-27`), atau web di port 8080 yang meneruskan `/api/` (`apps/web/nginx.conf:5`). Host VM dan URL publik belum ada di repo.
3. Pemeriksaan: `/live` harus 200 dengan `status` `ok`. `/ready` harus 200 dengan `database` `connected`. Runbook lama menulis `{ "status": "UP" }` untuk `/live`. Itu tidak sesuai kode.
4. Batasan: `/ready` hanya menjalankan `SELECT 1` (`health.routes.ts:15`). Endpoint ini tidak memastikan migrasi sudah diterapkan, jadi langkah 3 harus dicek sendiri.

### Langkah 6. Smoke test (manual)

1. Buka halaman `/login` lewat alamat web (`apps/web/src/app/router/index.tsx:49`). Login dengan akun uji yang disiapkan QA. Jangan tulis kredensial di tiket atau runbook.
2. Setelah login, halaman `/dashboard` harus tampil (`router/index.tsx:70`).
3. Di alat developer browser, cookie `staffora.sid` harus ada dengan flag `Secure` dan tetap ada setelah reload (`session.ts:40, 49`).
4. Pemeriksaan: halaman login tampil, login berhasil, dan dashboard tampil tanpa 401 berulang. Smoke test otomatis belum ada di repo.

## Verifikasi akhir

- `GET /api/v1/health/live` dan `GET /api/v1/health/ready` memberi hasil sesuai Langkah 5.
- Semua container berstatus `healthy` (Langkah 4).
- Login dan dashboard berfungsi, dan cookie `staffora.sid` memakai `Secure` (Langkah 6).
- Langkah yang belum bisa dicek karena belum ada di repo dicatat sebagai belum diverifikasi, bukan lulus.

## Jika gagal

- Build gagal (langkah 1): berhenti. Perbaiki di branch, jalankan gate di `CLAUDE.md` (lint, typecheck, test, build), lalu build ulang. Jangan rollout.
- Backup gagal atau belum tersedia: jangan lanjut ke migrasi. Backup belum ada di repo, jadi keputusan ada pada Tech Lead.
- Migrasi gagal: berhenti sebelum rollout. Pemulihan dari backup belum ada di repo. Lihat `docs/runbooks/rollback.md` bagian D untuk mitigasi migrasi, lalu eskalasi ke Arya Isnaidi.
- API tidak mau start: `env.ts:13-24` menolak boot tanpa `DATABASE_URL` atau `SESSION_SECRET` (minimal 32 karakter) di production. Cek nama variabel di VM. Jangan salin nilai ke log atau chat.
- `/ready` mengembalikan 503 dengan `database: "disconnected"`: cek container `db` dan nilai `DATABASE_URL` (`docker-compose.yml:24`).
- Login tidak bertahan, atau dashboard mengembalikan 401 setelah login: cek HTTPS dan `X-Forwarded-Proto` di proxy TLS (1.1). Jangan ubah `NODE_ENV`.
- Rollback aplikasi: lihat `docs/runbooks/rollback.md` bagian C. Perintah di sana memakai image tag yang belum ada di compose (lihat langkah 4).
- Jika penyebab tidak jelas, atau langkah tidak bisa dicek, berhenti dan hubungi Tech Lead Arya Isnaidi.

## Belum diverifikasi

- Langkah backup database: belum ada di repo, termasuk perintah, lokasi file, dan cara restore.
- Perintah migrasi dan rollout di VM: belum ada di repo. Image runtime tidak memuat `prisma/` (langkah 3).
- Nama host VM, user, lokasi folder deployment, dan URL staging serta production: belum ada di repo.
- GitHub Environment dan manual approval: belum ada di repo. Runbook lama mengklaimnya, tetapi `deploy-production.yml` tidak punya `environment:`.
- Secret GitHub, kredensial GHCR, dan kunci SSH: belum ada di repo.
- Push image ke GHCR dan tag berdasarkan SHA atau semver: belum ada di repo. ADR-008 menyebutnya (`docs/architecture/decisions/adr-008-ci-cd-pipeline.md:13, 18`).
- TLS dan header `X-Forwarded-Proto`: belum ada di repo. ADR-007 menyebut Nginx mengakhiri TLS.
- Gejala login lewat HTTP: runbook lama menulis login 200 tanpa `Set-Cookie`. Belum diuji di repo ini.
- Versi minimum Docker Compose untuk tag `!reset`: belum diverifikasi.
- Output sukses `prisma migrate deploy` dan status container di VM: belum diverifikasi.
- Riwayat run deployment di GitHub Actions: belum dicek karena `gh` tidak tersedia di mesin ini.
- Nomor bagian TSD 16.x yang dikutip runbook lama dan `rollback.md`: teks TSD tidak ada di repo, jadi belum diverifikasi.
- Akses `/api/v1/health/ready` lewat port 8080 (web): belum diuji.
