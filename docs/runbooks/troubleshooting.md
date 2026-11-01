# Runbook: Troubleshooting Operasional Staffora

- **Pemilik**: Fikri (QA & DevOps) untuk Docker dan database lokal. Saiful & Jundy (BE) untuk gejala di kode API dan migrasi. Eskalasi ke Arya Isnaidi (Tech Lead). Sumber: `CLAUDE.md`, bagian Team and Work Model.
- **Kapan dipakai**: Respons API 401, 403, 409, 422, 429, 500, atau 501 yang tidak sesuai harapan; `GET /api/v1/health/ready` tidak 200; API gagal start; `prisma migrate deploy` gagal; atau frontend tidak bisa memanggil API.
- **Risiko**: Bagian migrasi mengubah dan menghapus baris master data (`departments`, `job_roles`, `skills`) beserta referensinya. Salah memilih baris yang dipertahankan memindahkan referensi karyawan, alokasi, dan skill ke data yang salah. Prosedur backup dan restore belum ada di repo (lihat `docs/runbooks/deployment.md`, langkah 2).
- **Terakhir diuji**: 2026-11-01. SQL migrasi, skrip `db:migrate:deploy` dan `db:seed`, serta respons HTTP API lokal diuji pada PostgreSQL 18 kosong di container sementara dengan data uji, bukan data nyata. Stack Docker penuh dan browser belum diuji.

## Prasyarat

- Node.js 24 sesuai `engines` di `package.json`, dan Docker Compose. Lihat `docs/development/local-setup.md` bagian 1.
- File `apps/api/.env` dibuat dari `apps/api/.env.example` (`docs/development/local-setup.md` bagian 3). Nama variabel yang relevan: `NODE_ENV`, `PORT`, `DATABASE_URL`, `SESSION_SECRET`. Nilainya tidak ditulis di dokumen ini.
- Untuk migrasi dan merge data: akses ke database target dan backup yang sudah dikonfirmasi Tech Lead. Prosedur backup belum ada di repo, jadi keputusan ada pada Tech Lead.
- Jangan menyalin nilai `DATABASE_URL` atau `SESSION_SECRET` ke log, tiket, atau chat.

## Langkah

### Triage awal (semua gejala)

1. Cek `GET /api/v1/health/live` (harus 200 dengan `status: "ok"`) dan `GET /api/v1/health/ready` (harus 200 dengan `database: "connected"`). Lihat `apps/api/src/modules/health/health.routes.ts:6-26`.
2. Catat `requestId` dari body error. Body berbentuk `{message, code, errors, meta, requestId}` (`apps/api/src/common/errors/error-handler.ts:22-28`). Nilai yang sama ada di header `X-Request-Id` (`apps/api/src/common/http/request-id.ts:9`). Cari `requestId` itu di log API.
3. Cocokkan `code` dengan [katalog error](../api/error-catalog.md). Jika `code` tidak ada di katalog, catat sebagai selisih.

### Pola 1: `/health/ready` 503 (database tidak terjangkau)

- **Gejala**: `GET /api/v1/health/ready` menjawab 503 dengan `{"status":"unavailable","database":"disconnected"}`. Runbook lama menulis `DOWN`, yang tidak sesuai kode. Jika database putus saat API berjalan, log berisi `Idle connection in the session store pool failed` (`apps/api/src/common/auth/session.ts:23-28`).
- **Diagnosis**:
  - Stack Docker: `docker compose ps` harus menunjukkan `db` dalam keadaan sehat. Log database lewat `docker compose logs db` (belum ada di repo).
  - `DATABASE_URL` harus sesuai tempat API berjalan. Host memakai `localhost:5433` (`docker-compose.yml:8-9`), sedangkan container API memakai hostname `db` (`docker-compose.yml:24`).
  - Jika variabel tidak terbaca, `apps/api/src/common/database/prisma.ts:12` memakai nilai default lokal, dan API tidak mencatat peringatan apa pun tentang itu.
- **Perbaikan**:
  - Jalankan database dengan `docker compose up -d db` (`docs/development/local-setup.md` bagian 4).
  - Perbaiki `DATABASE_URL` di `apps/api/.env`, lalu restart API. `dotenv` hanya membaca file saat proses mulai (`apps/api/src/server.ts:1`).
  - Saat database kembali, `/ready` pulih tanpa restart API (diuji).

### Pola 2: API gagal start

- **Gejala**: Proses keluar dengan `ZodError` yang menunjuk `SESSION_SECRET` atau `DATABASE_URL`.
- **Diagnosis**: Aturan ada di `apps/api/src/config/env.ts`. `SESSION_SECRET` minimal 32 karakter di semua mode (baris 10). `DATABASE_URL` harus diawali `postgresql://` (baris 9). Di production keduanya wajib (baris 13-24). Di development, `SESSION_SECRET` yang kosong memakai nilai fallback lokal (`session.ts:59-62`), tetapi nilai yang diisi dan pendek tetap ditolak. Diuji: `SESSION_SECRET` 5 karakter membuat proses keluar dengan kode 1.
- **Perbaikan**: Perbaiki nilai di `apps/api/.env` atau di environment. Jangan menurunkan `NODE_ENV` untuk melewati error ini (lihat `docs/runbooks/deployment.md` bagian 1.1).

### Pola 3: 403 `FORBIDDEN` "Invalid or missing CSRF token." pada POST, PUT, PATCH, DELETE, atau login

- **Gejala**: Body `{"message":"Invalid or missing CSRF token.","code":"FORBIDDEN"}` (diuji). Pesan `Forbidden: Invalid CSRF Token` dari runbook lama tidak ada di kode (`apps/api/src/common/auth/csrf.ts:35`).
- **Penyebab**, urut dari yang paling sering:
  1. Header `X-CSRF-Token` tidak dikirim. Web client menambahkannya di `apps/web/src/api/client.ts:86-92`.
  2. Token berasal dari sesi lain. Token terikat ke sesi (`csrf.ts:30-34`). Login membuat sesi dan token baru (`apps/api/src/common/auth/session.ts:103-112`), jadi token dari sebelum login tidak berlaku lagi sesudahnya (diuji).
  3. Sesi sudah habis atau dihapus. Sesi kedaluwarsa setelah 8 jam tidak aktif (`session.ts:41`). Pemeriksaan CSRF berjalan sebelum rute (`apps/api/src/app.ts:122`), jadi POST dengan sesi yang hilang menjawab 403, bukan 401 (diuji dengan menghapus baris sesi).
  4. Cookie `staffora.sid` tidak terkirim. Web client memakai `credentials: "include"` (`client.ts:41`, `107`). Dengan `NODE_ENV=production`, cookie diberi `Secure` (`session.ts:49`), sehingga akses HTTP biasa tidak membawa cookie (lihat `docs/runbooks/deployment.md` bagian 1.1).
- **Diagnosis**: Di browser, pastikan request POST membawa `X-CSRF-Token` dan `staffora.sid`. Selama sesi sama, `GET /api/v1/auth/csrf-token` mengembalikan token yang sama (`session.ts:115-123`, `apps/api/src/modules/identity/identity.controller.ts:52-54`).
- **Perbaikan**:
  - Jika submit form lebih dulu mengenai sesi yang habis, token lama tetap ada di cache web. `client.ts:118-120` hanya menghapusnya saat 401, bukan 403. Submit berikutnya tetap gagal dengan 403 sampai halaman dimuat ulang, lalu login ulang. Perbaikan di kode belum ada di repo.
  - Untuk login, pastikan token diambil dulu dari `GET /api/v1/auth/csrf-token` (`apps/api/src/modules/identity/identity.routes.ts:27-29`).

### Pola 4: 401 `UNAUTHORIZED` pada request GET, atau user terlempar ke halaman login

- **Gejala**: Body berisi `Authentication required to access this resource.` (`apps/api/src/common/auth/rbac.ts:10-21`). Web client menganggap sesi hilang dan mengeluarkan user dari aplikasi (`client.ts:118-126`).
- **Penyebab**:
  - Sesi tidak ada atau sudah habis (`session.ts:41`).
  - Akun nonaktif. Sesi milik akun nonaktif dibuang pada request berikutnya (`apps/api/src/common/auth/identity-loader.ts:19-24`, `apps/api/src/modules/identity/identity.service.ts:38-40`). Login dengan akun nonaktif menjawab 401 `Invalid email or password.` (`identity.service.ts:26, 31-33`), sama seperti kata sandi salah.
- **Diagnosis**: Cek baris di tabel `user_sessions` untuk nilai cookie tersebut (kolom `sid` dan `expire`, `apps/api/prisma/migrations/20261005113838_init/migration.sql:27-32`). Cek juga kolom `is_active` di tabel `users` (`apps/api/prisma/schema.prisma:35`). Query yang dipakai belum ada di repo.
- **Perbaikan**: Login ulang. Jika akun seharusnya aktif, minta Admin mengubah status user. Endpoint `/users` hanya untuk ADMIN (`identity.routes.ts:34`). Lihat `docs/security/rbac-matrix.md`.

### Pola 5: 429 `RATE_LIMITED` pada login

- **Gejala**: Percobaan login keenam dalam 15 menit untuk pasangan IP dan email yang sama menjawab 429 `Too many login attempts. Please try again after 15 minutes.` (`apps/api/src/common/auth/rate-limiter.ts:47-48, 56-69`). Diuji: lima percobaan 401, percobaan keenam 429.
- **Penyebab**: Hitungan disimpan di memori proses (`rate-limiter.ts:9`) dan dicatat untuk setiap percobaan sebelum controller dijalankan, termasuk percobaan yang berhasil (`rate-limiter.ts:19-30, 61`). Batas umum adalah 300 per menit untuk user terautentikasi dan 100 per menit untuk anonim (`rate-limiter.ts:51, 54`). Batas ini tidak dibagi antar instance (`docs/security/authentication.md`, bagian Rate limit).
- **Diagnosis**: Pesan login berbeda dari pesan batas umum `API rate limit exceeded...` (`rate-limiter.ts:76-79, 86-89`). Pastikan 429 berasal dari endpoint login.
- **Perbaikan**: Tunggu 15 menit. Di lokal, restart API mereset hitungan karena hitungan ada di memori (dari kode, belum diuji). Di lingkungan lain, eskalasi ke Tech Lead sebelum restart.

### Pola 6: Frontend tidak bisa memanggil API

- **Gejala A, dev Vite di `http://localhost:5173`**: Request ke `/api/...` gagal dengan error proxy. Vite meneruskan `/api` ke `VITE_API_PROXY_TARGET`, dengan default `http://localhost:3000` (`apps/web/vite.config.ts:8-9, 20`). Di Docker dev, targetnya `http://api:3000` (`docker-compose.dev.yml:41`). Perbaikan: jalankan API dengan `npm run dev:api`.
- **Gejala B, browser memblokir karena CORS**: Origin yang diizinkan hanya `http://localhost:5173`, `http://localhost:3000`, dan nilai `CORS_ORIGIN` (`apps/api/src/app.ts:88-92`). Diuji: origin `http://localhost:8080` tidak mendapat header `Access-Control-Allow-Origin`, sedangkan `http://localhost:5173` mendapatnya. Web di `http://localhost:8080` lewat nginx tidak butuh CORS, karena `/api/` diteruskan dari origin yang sama (`apps/web/nginx.conf:5`). `CORS_ORIGIN` tidak ada di `apps/api/.env.example`.
- **Gejala C, perubahan kode tidak ter-reload di Docker dev pada Windows**: `docker-compose.dev.yml` menyetel `CHOKIDAR_USEPOLLING` untuk api (baris 19) dan web (baris 43), dan `apps/web/vite.config.ts:14` membacanya. Jalankan stack lewat `npm run stack:up` agar kedua file compose dipakai. Belum diuji di Windows.

### Pola 7: 501 `NOT_IMPLEMENTED` dan `CAPACITY_CONFLICT` yang tidak pernah muncul

- **Gejala**: `POST /api/v1/allocations` dengan body valid menjawab 501 `Allocation creation is not implemented in Sprint 1.` (diuji). Hal yang sama berlaku untuk `GET /api/v1/allocations` (diuji), `GET /api/v1/capacity`, dan `GET /api/v1/capacity/employees/:id`. `PATCH /api/v1/allocations/:id`, `POST .../end`, dan `POST .../cancel` menjawab 501 untuk id yang ada, dan 404 untuk id yang tidak ada (`allocations.service.ts:63-66, 82-84, 97-99`).
- **Penyebab**: Stub Sprint 1. Route, validasi, dan pemeriksaan akses berjalan, lalu service melempar `NotImplementedError` (`apps/api/src/modules/allocations/allocations.service.ts:53-55, 72-74, 91-93, 106-108`; `apps/api/src/modules/capacity/capacity.routes.ts:18-19, 32-33`). Validasi input tetap berjalan lebih dulu dan menjawab 422 (diuji). Lihat `docs/architecture/modules/allocations.md`.
- **Diagnosis**: 501 bukan bug runtime. Jangan memperlakukannya sebagai `CAPACITY_CONFLICT`.
- **`CAPACITY_CONFLICT` (409)**: Kode ini didefinisikan dengan `meta` berisi `peakAllocation`, `requestedAllocation`, `remainingCapacity`, `conflictStartDate`, `conflictEndDate` (`apps/api/src/common/errors/app-error.ts:90-103`). Tidak ada jalur runtime di repo yang melemparnya. `new CapacityConflictError` tidak dipanggil di `apps/api/src`, dan `buildCapacityConflictDetail` hanya dipakai di tes (`apps/api/tests/capacity.test.ts`). Engine kapasitas dipakai untuk tampilan read-only (`apps/api/src/modules/workforce/workforce.views.ts:54, 132`).
- **Perbaikan**: Tidak ada perbaikan operasional. Jika `CAPACITY_CONFLICT` tetap muncul, kemungkinan besar build atau branch yang dijalankan berbeda dari repo ini. Catat dan eskalasi ke Saiful & Jundy.

### Pola 8: 500 atau transaksi gagal dengan P2028 (pool koneksi habis)

- **Gejala**: 500 dengan `An unexpected internal server error occurred.` (`error-handler.ts:34-40`). Atau transaksi gagal dengan `P2028` saat banyak assign skill berjalan bersamaan.
- **Penyebab**: Untuk P2028, komentar di kode menyebut bahwa query yang memakai client modul di dalam transaksi meminta koneksi kedua dari pool (`apps/api/src/modules/skills/skills.assignment.service.ts:138-141`). Pool dibuat tanpa opsi `max` (`apps/api/src/common/database/prisma.ts:13`), sehingga memakai default library.
- **Diagnosis**: Untuk 500, cari `requestId` di log pada entri `Unhandled exception occurred` (`error-handler.ts:33`). Untuk P2028, cari pemanggilan repository di dalam `withTransaction` (`skills.assignment.service.ts:142`) yang tidak meneruskan `tx`.
- **Perbaikan**: Teruskan `tx` ke semua query di dalam transaksi. Perbaikan ini ada di kode, jadi dikerjakan BE (Saiful & Jundy) lewat PR.

### Pola 9: `prisma migrate deploy` gagal karena duplikat case-insensitive (P3018)

Query di bagian ini belum ada di repo sebagai skrip. Lihat "Belum diverifikasi".

- **Gejala**: Migrasi berhenti dengan pesan untuk tabel pertama yang bermasalah (diuji):
  - `departments`: `Cannot add the case-insensitive unique index on departments.name. Merge or rename these duplicates first: it ops (2 rows)` (`apps/api/prisma/migrations/20261014160000_workforce_normalized_name_uniqueness/migration.sql:25-29`).
  - `skills`: `Cannot add the case-insensitive unique index on skills.name. ... react -> <id> (React), <id> (react) [2 rows]` (`apps/api/prisma/migrations/20261018120000_skills_normalized_name_uniqueness/migration.sql:30-34`).
  - Deploy berikutnya ditolak dengan `P3009` karena migrasi gagal masih tercatat. Ini perilaku Prisma, belum diuji dengan Prisma CLI.
- **Penyebab**: Kondisi data, bukan bug kode. Migrasi menambah unique index pada `lower(name)` untuk `departments` dan `job_roles` (`20261014160000`, baris 47-48) dan untuk `skills` (`20261018120000`, baris 38). Index gagal dibuat jika ada dua baris yang sama setelah di-lowercase. Lihat [indexes](../database/indexes.md).
- **Diagnosis** (read-only). Satu query untuk tiga tabel. Setiap baris hasil adalah satu grup duplikat. Pesan migrasi hanya menyebut satu tabel per run, jadi ulangi query ini setelah setiap perbaikan.

  ```sql
  SELECT 'departments' AS tabel, lower(name) AS normalized, count(*) AS baris FROM departments GROUP BY lower(name) HAVING count(*) > 1
  UNION ALL SELECT 'job_roles', lower(name), count(*) FROM job_roles GROUP BY lower(name) HAVING count(*) > 1
  UNION ALL SELECT 'skills', lower(name), count(*) FROM skills GROUP BY lower(name) HAVING count(*) > 1;
  ```

- **Perbaikan**:
  1. Pilih pasangan per grup. Baris paling lama (`created_at`, lalu `id`) dipertahankan, baris kedua dibuang. Ganti nama tabel sesuai grup. Jika grup punya tiga baris atau lebih, ulangi setelah tiap pasangan.

     ```sql
     SELECT lower(name) AS normalized,
            (array_agg(id ORDER BY created_at, id))[1] AS keep_id,
            (array_agg(id ORDER BY created_at, id))[2] AS drop_id
     FROM departments GROUP BY lower(name) HAVING count(*) > 1;
     ```

  2. Pindahkan referensi lalu hapus baris drop. Ganti `'<keep_id>'` dan `'<drop_id>'` dengan UUID, termasuk tanda kutipnya. Jalankan satu blok per pasangan, dan jangan campur tabel dalam satu blok.

     Departments:

     ```sql
     BEGIN;
     UPDATE employees SET department_id = '<keep_id>' WHERE department_id = '<drop_id>';
     DELETE FROM departments WHERE id = '<drop_id>';
     COMMIT;
     ```

     Job roles. Referensinya ada di `employees.job_role_id`, `allocations.job_role_id`, dan `staffing_requirements.job_role_id` (`apps/api/prisma/schema.prisma:91, 162, 201`):

     ```sql
     BEGIN;
     UPDATE employees SET job_role_id = '<keep_id>' WHERE job_role_id = '<drop_id>';
     UPDATE allocations SET job_role_id = '<keep_id>' WHERE job_role_id = '<drop_id>';
     UPDATE staffing_requirements SET job_role_id = '<keep_id>' WHERE job_role_id = '<drop_id>';
     DELETE FROM job_roles WHERE id = '<drop_id>';
     COMMIT;
     ```

     Skills. Satu karyawan tidak boleh memegang skill yang sama dua kali (`employee_skills`, unique pada `employee_id, skill_id`), dan satu kebutuhan staf juga tidak (`staffing_requirement_skills`). Baris yang bentrok digabung ke level tertinggi dulu, baru baris drop dihapus:

     ```sql
     BEGIN;
     UPDATE employee_skills AS k SET proficiency_level = GREATEST(k.proficiency_level, d.proficiency_level)
     FROM employee_skills AS d
     WHERE k.skill_id = '<keep_id>' AND d.skill_id = '<drop_id>' AND d.employee_id = k.employee_id;
     DELETE FROM employee_skills AS d USING employee_skills AS k
     WHERE d.skill_id = '<drop_id>' AND k.skill_id = '<keep_id>' AND k.employee_id = d.employee_id;
     UPDATE employee_skills SET skill_id = '<keep_id>' WHERE skill_id = '<drop_id>';

     UPDATE staffing_requirement_skills AS k SET minimum_proficiency_level = GREATEST(k.minimum_proficiency_level, d.minimum_proficiency_level)
     FROM staffing_requirement_skills AS d
     WHERE k.skill_id = '<keep_id>' AND d.skill_id = '<drop_id>' AND d.staffing_requirement_id = k.staffing_requirement_id;
     DELETE FROM staffing_requirement_skills AS d USING staffing_requirement_skills AS k
     WHERE d.skill_id = '<drop_id>' AND k.skill_id = '<keep_id>' AND k.staffing_requirement_id = d.staffing_requirement_id;
     UPDATE staffing_requirement_skills SET skill_id = '<keep_id>' WHERE skill_id = '<drop_id>';

     DELETE FROM skills WHERE id = '<drop_id>';
     COMMIT;
     ```

  3. Jalankan ulang query diagnosis. Hasilnya harus kosong.
  4. Tandai migrasi yang gagal sebagai rolled back. Perintah untuk langkah ini belum ada di repo.
  5. Jalankan `npm run db:migrate:deploy -w @staffora/api`.
- **Pencegahan**: Jalankan diagnosis sebelum migrasi ke lingkungan yang sudah berisi data.

## Verifikasi akhir

- `GET /api/v1/health/ready` menjawab 200 dengan `database: "connected"`.
- Setelah pola 9, diagnosis mengembalikan 0 baris, dan `npm run db:migrate:deploy -w @staffora/api` selesai tanpa error. Diuji pada database uji.
- Setelah login, respons POST dengan token baru tidak lagi 403.
- Setiap `code` error yang tersisa ada di [katalog error](../api/error-catalog.md).

## Jika gagal

- Migrasi gagal lagi: berhenti. Baca pesan yang baru dan jalankan diagnosis ulang. Jangan mengulang merge tanpa diagnosis.
- Merge memilih baris yang salah atau data hilang: berhenti. Catat `keep_id` dan `drop_id`. Pemulihan belum ada di repo. Eskalasi ke Arya Isnaidi.
- Gejala tidak ada di daftar: ambil `requestId`, cari di log, lalu eskalasi ke Saiful & Jundy (BE) atau Fikri (DevOps).

## Belum diverifikasi

- Stack Docker penuh (`npm run stack:up`), web di browser, dan perilaku 403 pada web setelah sesi habis. Perilaku web dibaca dari `apps/web/src/api/client.ts`, belum diuji di browser.
- Kode P3018 dan P3009 adalah kode Prisma. Pengujian memakai `psql` dan `prisma migrate deploy` yang sukses, jadi jalur gagal di Prisma CLI belum diuji. Perintah untuk menandai migrasi gagal sebagai rolled back belum ada di repo.
- SQL diagnosis dan merge di pola 9 belum ada di repo sebagai skrip. Sudah dijalankan di PostgreSQL 18 kosong dengan data uji. Belum dijalankan terhadap data nyata atau staging.
- `docker compose logs db` belum ada di repo. Perintah ini perlu dicek sebelum dipakai di VM.
- Penyebab P2028 belum direproduksi dan hanya dibaca dari komentar di `skills.assignment.service.ts:138-141`. Timeout lock `FOR SHARE` di `apps/api/src/modules/skills/skills.repository.ts:102-115` belum diuji.
- Restart API sebagai cara mereset rate limit, dari kode (`rate-limiter.ts:9`), belum diuji.
- Gejala C (CHOKIDAR di Windows) belum diuji.
- `lock_timeout` dan opsi `max` pool tidak ada di repo (`prisma.ts:13`). Runbook lama menyebut lock timeout yang "wajar" dan hold time di bawah 10 ms. Kedua klaim itu tidak bisa diverifikasi dan dibuang.
- Prosedur backup, restore, dan rollout ke VM belum ada di repo (lihat `docs/runbooks/deployment.md` langkah 2 dan 4).
- `CORS_ORIGIN` dan `LOG_LEVEL` dibaca dari kode (`apps/api/src/app.ts:91`, `apps/api/src/common/logging/logger.ts:4`). Keduanya tidak ada di `apps/api/.env.example`.
- Apakah ada build atau cabang di luar repo ini yang melempar `CAPACITY_CONFLICT`: belum diverifikasi.
- Akun uji dan kata sandi seed ada di `docs/development/local-setup.md` bagian 7. Nilainya tidak disalin ke dokumen ini.
