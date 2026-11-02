# Modul identity

- Status: Verified (klaim diperiksa terhadap kode di `apps/api/src/modules/identity/` dan `docs/api/openapi.yaml`; PRD dan TSD tidak ada di repo, lihat bagian Belum diverifikasi)
- Pemilik: Backend (Saiful & Jundy)
- Story PRD: US01.01 (sesi: login, logout, identitas), US01.02 (otorisasi: RBAC dan tautan user-employee)
- Sumber: PRD (rujuk ID story, jangan salin teks), TSD (rujuk nomor bagian: §8.1, §8.2, §8.3, §8.5), docs/api/openapi.yaml, docs/database/erd.md

Catatan referensi: `file:baris` tanpa folder berarti `apps/api/src/modules/identity/`. Path lain relatif ke `apps/api/src/` (kecuali `prisma/` dan `tests/`, relatif ke `apps/api/`) atau ke root repo (`docs/`).

## Tanggung jawab

- Sign-in dan sign-out: memverifikasi email dan password, membuat sesi server-side dengan rotasi ID sesi dan token CSRF, lalu menghapus sesi saat logout (`identity.service.ts:13-36`, `common/auth/session.ts:103-112`, `common/auth/session.ts:125-131`).
- Identitas per request: `resolveSessionUser` dipanggil oleh `identityLoaderMiddleware` untuk setiap sesi yang membawa `userId` (`common/auth/identity-loader.ts:17`).
- Token CSRF: `GET /auth/csrf-token` sengaja publik supaya login pun terlindungi (`identity.routes.ts:27-29`). Pemeriksaan header `X-CSRF-Token` dilakukan global di `app.ts:122`, bukan di modul ini.
- Manajemen akun oleh ADMIN: daftar, buat, ubah role, status aktif, dan tautan employee (`identity.routes.ts:31-46`).
- Aturan tautan user-employee: role selain ADMIN wajib tertaut ke employee; ADMIN boleh tidak tertaut (`common/auth/policy.ts:75-92`, sesuai `docs/database/erd.md` §2.1).

## Struktur file

Folder modul berisi enam file. Penamaan mengikuti `<domain>.<role>.ts` (`CODING_STANDARD.md` §10).

| File | Baris | Peran |
| --- | --- | --- |
| `identity.routes.ts` | 46 | Dua router: `authRouter` (`/auth`) dan `usersRouter` (`/users`), beserta middleware chain |
| `identity.controller.ts` | 97 | Membaca request, memanggil service, mengirim envelope `{ data }` atau 204 |
| `identity.service.ts` | 230 | Aturan login, buat dan ubah user, cek tautan employee, bentuk objek identitas |
| `identity.repository.ts` | 124 | Satu-satunya akses Prisma untuk `users`, plus `employees` dan relasinya |
| `identity.schema.ts` | 23 | Skema Zod untuk login, create user, dan update user |
| `.gitkeep` | - | Penanda folder, tidak punya peran runtime |

## Endpoint

Basis path `/api/v1` (`app.ts:127-132`). Kode error memakai kelas di `common/errors/app-error.ts`. Modul ini tidak mendefinisikan kode error khusus.

| Method dan path | Peran yang boleh | Kode error utama | Sumber |
| --- | --- | --- | --- |
| POST `/auth/login` | Publik, dibatasi rate limit | 401 UNAUTHORIZED (pesan generik), 403 FORBIDDEN (CSRF), 422 UNPROCESSABLE_ENTITY, 429 RATE_LIMITED | routes:19-24, openapi:46-119 |
| POST `/auth/logout` | Semua role dengan sesi aktif | 401 UNAUTHORIZED, 403 FORBIDDEN (CSRF); sukses 204 | routes:25, openapi:121-142 |
| GET `/auth/me` | Semua role dengan sesi aktif | 401 UNAUTHORIZED | routes:26, openapi:144-165 |
| GET `/auth/csrf-token` | Publik | Tidak ada error khusus; sukses 200 | routes:27-29, openapi:167-194 |
| GET `/users` | ADMIN | 401 UNAUTHORIZED, 403 FORBIDDEN | routes:34-35, openapi:196-211 |
| POST `/users` | ADMIN | 401, 403, 404 NOT_FOUND*, 409 CONFLICT, 422 UNPROCESSABLE_ENTITY; sukses 201 | routes:36-40, openapi:212-244 |
| PATCH `/users/{id}` | ADMIN | 401, 403, 404 NOT_FOUND, 409 CONFLICT*, 422 UNPROCESSABLE_ENTITY (termasuk `id` bukan UUID) | routes:41-46, openapi:246-280 |

Keterangan: tanda * berarti kode mengembalikan status itu, tetapi kontrak tidak mendeklarasikannya (lihat Drift). Path `/users/{id}` hanya punya PATCH, baik di kode maupun di kontrak. Tidak ada GET `/users/{id}`.

Pesan 401 pada login sama untuk email tidak dikenal, password salah, dan akun nonaktif (`identity.service.ts:25-33`).

## Entitas dan tabel

- `users` (ERD §2.1): dibaca dan ditulis. Kolom yang disentuh: `normalized_email` (unik), `password_hash`, `role`, `is_active`, `employee_id`, `created_by`, `updated_by`. Model Prisma di `prisma/schema.prisma:30-45`.
- `user_sessions` (ERD §2.2): penyimpanan sesi `connect-pg-simple` (`common/auth/session.ts:68-74`, `createTableIfMissing: false`). Modul ini tidak query tabel ini secara langsung. Logout menghapus baris lewat `destroySession`.
- `employees` (ERD §2.4): dibaca oleh `findEmployeeById` (`identity.repository.ts:113-117`) untuk cek keberadaan dan status ACTIVE, dan lewat relasi `include` pada query user.
- `departments` dan `job_roles` (ERD §2.3): hanya dibaca lewat relasi `employee.department` dan `employee.jobRole` untuk nama di respons (`identity.service.ts:118-120`, `identity.service.ts:224-226`).
- Tabel lain tidak disentuh modul ini.

## Aturan bisnis dan otorisasi

Setiap aturan merujuk ID. Kolom kanan berisi bukti di kode dan tes (`tests/` ada di `apps/api/`).

- BR02, AC02.03, AC02.04, AC02.05: pesan gagal login sama untuk semua kasus kredensial dan akun nonaktif, dan verifikasi password tetap berjalan untuk email yang tidak dikenal. Bukti: `identity.service.ts:19-33`, `common/auth/password.ts:16-26`; tes `tests/identity-auth.service.test.ts:62, 79, 100`.
- AC02.05, BR01: akun nonaktif tidak bisa login, dan sesinya dilepas pada request berikutnya. Bukti: `identity.service.ts:31-33`, `identity.service.ts:38-44`, `common/auth/identity-loader.ts:19-23`; tes `tests/identity-auth.service.test.ts:162`.
- AC02.01: respons identitas tidak memuat field kredensial. Bukti: `identity.service.ts:210-230`; tes `tests/identity-auth.service.test.ts:118`.
- AC03.02: endpoint terproteksi tanpa cookie mengembalikan 401 dan tidak mengirim cookie. Bukti: tes `tests/auth-session.integration.test.ts:85`.
- US01.02 (AC01.03, AC01.04 menurut klaim PR): seluruh `/users` hanya untuk ADMIN. Bukti: `identity.routes.ts:34`; tes `tests/authorization.test.ts:272-340`.
- BR-G02 (ERD §2.1): tautan employee wajib untuk role selain ADMIN. Bukti: `common/auth/policy.ts:75-92`; tes `tests/authorization.test.ts:912-956`.
- Email unik setelah normalisasi (trim dan lowercase). Bukti: `prisma/schema.prisma:32`, `identity.repository.ts:19`, `identity.service.ts:53-58`.
- Satu employee hanya boleh tertaut ke satu user. Bukti: `prisma/schema.prisma:36`, `identity.service.ts:76-83`, `identity.service.ts:155-162`.
- Password minimal 12 karakter saat membuat user (`identity.schema.ts:12`). Login hanya memeriksa tidak kosong (`identity.schema.ts:5`), sesuai kontrak `openapi.yaml:78`.
- Hash bcrypt dengan cost 12 (TSD §8.2, dirujuk di `CODING_STANDARD.md` §7). Bukti: `common/auth/password.ts:4`.
- Sesi: ID diregenerasi saat login (TSD §8.1, `common/auth/session.ts:99-101`). Token CSRF sinkron disimpan di sesi (TSD §8.3, `session.ts:101`, `common/auth/csrf.ts:5`). Cookie `staffora.sid` dengan timeout inaktivitas 8 jam yang bergulir (`session.ts:40-41`, `session.ts:76-87`).
- Rate limit login: 5 percobaan per 15 menit per kombinasi IP dan email. Bukti: `common/auth/rate-limiter.ts:47-48`, `common/auth/rate-limiter.ts:56-69`; kontrak `openapi.yaml:57`.

## Dependensi

- Modul lain yang dipanggil: tidak ada. Modul identity tidak memanggil service modul lain. `workforceService` (`modules/workforce/workforce.service.ts:66`) adalah service publik workforce, tetapi tidak dipakai di sini. Repository membaca tabel `employees`, `departments`, dan `job_roles` langsung lewat Prisma (lihat Drift nomor 9).
- Pemanggil dari luar: `common/auth/identity-loader.ts:2, 17` memanggil `identityService.resolveSessionUser`. `app.ts:21` dan `app.ts:131-132` memasang `authRouter` dan `usersRouter`.
- Common yang dipakai: `common/auth/session.ts` (establishSession, ensureCsrfToken, destroySession, clearSessionCookie), `common/auth/rbac.ts` (requireAuth, requireRole), `common/auth/rate-limiter.ts` (loginRateLimitMiddleware), `common/auth/password.ts`, `common/auth/policy.ts` (validateUserEmployeeLinkage), `common/auth/types.ts`, `common/errors/app-error.ts`, `common/validation/validate.ts`, `common/http/response.ts`, `common/http/params.ts`, `common/database/prisma.ts`.
- Middleware global yang memengaruhi modul: identity loader (`app.ts:119`), CSRF (`app.ts:122`), dan rate limit umum `/api/v1` (`app.ts:125`).

## Drift dan catatan

1. Kontrak lebih longgar dari kode untuk `employeeId` pada create user. Kontrak mengizinkan `null` (`openapi.yaml:1799`), tetapi `identity.schema.ts:14` hanya `.uuid().optional()`, sehingga `null` ditolak dengan 422.
2. POST `/users` mengembalikan 404 NOT_FOUND saat employee tidak ditemukan (`identity.service.ts:65-66`; tes `tests/authorization.test.ts:880`). Respons 404 ini tidak ada di `openapi.yaml:212-244`.
3. PATCH `/users/{id}` mengembalikan 409 CONFLICT saat employee sudah tertaut ke user lain (`identity.service.ts:158-161`). Respons 409 ini tidak ada di `openapi.yaml:263-280`, dan belum ada tes untuknya.
4. GET `/users` menambahkan `employeeName` dan `createdAt` (`identity.service.ts:199-201`). Field itu tidak ada di skema `UserIdentity` (`openapi.yaml:1754-1778`).
5. Bentuk objek identitas tidak seragam. PATCH mengembalikan lima field tanpa `employee` (`identity.service.ts:183-189`). Login, `/auth/me`, dan POST `/users` memuat `employee` (`identity.service.ts:105-122`, `identity.service.ts:210-230`).
6. Kontrak `/auth/me` menyebut sesi akun nonaktif "destroyed" (`openapi.yaml:147`). Kode meregenerasi sesi tanpa user (`common/auth/identity-loader.ts:19-23`). Hasil 401 sama, mekanismenya berbeda.
7. Race condition: create dan update user tidak memetakan P2002 lewat `mapUniqueViolation` (`common/errors/unique-violation.ts:58-72`). Pola ini dipakai di `modules/workforce/workforce.service.ts:87` dan `modules/skills/skills.catalog.service.ts:69, 109`. Dua request paralel dengan email atau employee yang sama akan jatuh ke 500 INTERNAL_SERVER_ERROR (`common/errors/error-handler.ts:33-40`). Constraint terkait ada di `prisma/migrations/20261005113838_init/migration.sql:174, 177`. Tidak ada tes P2002 untuk identity.
8. ERD §2.1 tidak menyebut keunikan `employee_id`. Namun `prisma/schema.prisma:36` memakai `@unique`, dan migration membuat `users_employee_id_key` (`migration.sql:177`). `findByEmployeeId` (`identity.repository.ts:119-123`) bergantung pada keunikan ini.
9. Akses lintas modul: `identity.repository.ts:113-117` dan relasi `include` membaca tabel milik workforce langsung, bukan lewat `workforceService`. `CLAUDE.md` meminta komunikasi antarmodul lewat service publik. Perlu keputusan Tech Lead apakah pola ini diterima.
10. Dependensi terbalik: `common/auth/identity-loader.ts:2` mengimpor `identity.service.ts`, sehingga layer `common` bergantung pada modul.
11. Struktur: `CODING_STANDARD.md` §3.1 menetapkan `identity.policy.ts` dan `identity.types.ts`, tetapi keduanya tidak ada. Aturan role untuk `/users` ada di `identity.routes.ts:34`, dan aturan tautan ada di `common/auth/policy.ts`.
12. Tautan employee: `common/auth/policy.ts:84-88` hanya memeriksa bahwa employeeId tidak kosong. Status ACTIVE dicek hanya jika employeeId dikirim di body (`identity.service.ts:68`, `identity.service.ts:147`). Update role saja tidak memeriksa ulang status employee (`identity.service.ts:140-176`), padahal pesan di `policy.ts:87` menyebut "active employee record".
13. Tidak ada guard di `updateUser` (`identity.service.ts:126-190`) yang membandingkan `actorId` dengan `id`. Akibatnya ADMIN bisa menonaktifkan atau menurunkan role akunnya sendiri. Kontrak tidak mengatur hal ini. Apakah PRD melarangnya belum dicek.
14. Rate limiter login disimpan di memori per proses (`common/auth/rate-limiter.ts:8-17`). Limit tidak berlaku lintas instance.
15. Ukuran file: `identity.service.ts` 230 baris, mendekati batas split 250 baris di `CLAUDE.md`.

## Belum diverifikasi

- Isi PRD (AC dan BR). PRD tidak ada di repo. Daftar AC di dokumen ini hanya berasal dari klaim PR di catatan review internal (tidak di repo). Belum dikonfirmasi Tech Lead.
- Isi TSD §8. TSD tidak ada di repo. Nomor bagian yang dikutip hanya berasal dari komentar kode dan `CODING_STANDARD.md` §7.
- Tes belum dijalankan. Yang diperiksa hanya keberadaan dan nama tes.
- Jumlah instance deployment (`docs/architecture/decisions/adr-007-deployment-topology.md`) untuk menilai dampak rate limiter memori.
- Perilaku runtime, seperti cookie `Secure` di staging dan respons nyata dari database.
- Aturan BR-G02 dan aturan ERD lain di luar yang disebut modul ini.
