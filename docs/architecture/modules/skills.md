# Modul skills

- Status: Verified (klaim tentang kode, `docs/api/openapi.yaml`, dan `docs/database/erd.md` sudah diperiksa; teks PRD dan TSD tidak ada di repo, lihat bagian Belum diverifikasi)
- Pemilik: Backend (Saiful & Jundy)
- Story PRD: US02.02
- Sumber: PRD (rujuk ID story; teks tidak ada di repo), TSD (rujuk nomor bagian §9.2, §9.3, §10.4, §12.1 sebagaimana dikutip kartu `docs/tasks/sprint-1/US02.02.md`; teks tidak ada di repo), docs/api/openapi.yaml, docs/database/erd.md

Catatan referensi: `file:baris` tanpa folder berarti `apps/api/src/modules/skills/`. Path lain relatif ke `apps/api/src/` atau ke root repo.

## Tanggung jawab

- Katalog skill: daftar dengan filter dan paginasi, buat, ubah nama atau status aktif (`skills.catalog.service.ts:29-115`).
- Penugasan skill ke karyawan: daftar, tetapkan dengan level 1 sampai 5, ubah level, hapus penugasan (`skills.assignment.service.ts:43-246`).
- Guard skill nonaktif dan skill tidak valid yang dipanggil modul staffing lewat `skillsService` (`skills.assignment.service.ts:84-120`).
- Pembatasan baca profil karyawan untuk peran EMPLOYEE (`skills.policy.ts:16-23`).
- Di luar modul: data karyawan, kebutuhan staffing, kapasitas. Tidak ada endpoint hapus skill; `skills.routes.ts` hanya mendaftarkan GET, POST, dan PATCH untuk `/skills`.

## Struktur file

Folder berisi 13 file kode dan satu `.gitkeep`. Jumlah baris dari `wc -l`.

| File | Baris | Peran |
| --- | --- | --- |
| `skills.routes.ts` | 75 | Dua router (`skillsRouter`, `employeeSkillsRouter`) dengan rantai auth, role, dan validasi |
| `skills.controller.ts` | 160 | Membaca request, memanggil `skillsService`, mengirim envelope list, created, success, atau 204 |
| `skills.service.ts` | 12 | Fasad publik: menggabungkan catalog dan assignment service |
| `skills.catalog.service.ts` | 116 | Use case katalog: list, create, update skill |
| `skills.assignment.service.ts` | 247 | Use case penugasan, guard referensi dan keaktifan skill, transaksi assign |
| `skills.repository.ts` | 170 | Akses Prisma tabel `skills`, escape LIKE, lock `FOR SHARE` |
| `skills.employee.repository.ts` | 140 | Akses Prisma tabel `employee_skills` dan cek keberadaan `employees` |
| `skills.schema.ts` | 102 | Skema Zod untuk body, query, dan params |
| `skills.errors.ts` | 86 | Kode 409 dan 422 khusus skill; pemetaan unique violation |
| `skills.policy.ts` | 23 | Aturan baca profil karyawan, memakai helper common |
| `skills.views.ts` | 34 | Mapper record ke view `Skill` dan `EmployeeSkill` |
| `skills.types.ts` | 42 | Tipe record repository dan view |
| `skills.constants.ts` | 7 | Pesan 404 bersama (`SKILL_NOT_FOUND`, `ASSIGNMENT_NOT_FOUND`) |
| `.gitkeep` | 0 | Penanda folder, tanpa peran runtime |

## Endpoint

Semua route memakai `requireAuth()` (401 `UNAUTHORIZED`, `rbac.ts:10`). Batas peran di `requireRole` (403 `FORBIDDEN`, `rbac.ts:27`). POST, PATCH, dan DELETE memerlukan token CSRF; `skills.test.ts:1130` menguji 403 tanpa token. Router di-mount di `app.ts:136-141`.

| Method dan path | Peran yang boleh | Kode error utama | Sumber (routes / OpenAPI) |
| --- | --- | --- | --- |
| GET `/skills` | ADMIN, PROJECT_MANAGER, RESOURCE_MANAGER | 403 FORBIDDEN untuk EMPLOYEE; 422 UNPROCESSABLE_ENTITY (query) | routes:25; openapi:607-665 |
| POST `/skills` | ADMIN, RESOURCE_MANAGER | 409 DUPLICATE_SKILL_NAME; 422 | routes:31; openapi:666-706 |
| PATCH `/skills/{id}` | ADMIN, RESOURCE_MANAGER | 404 NOT_FOUND (`SKILL_NOT_FOUND`); 409 DUPLICATE_SKILL_NAME; 422 | routes:37; openapi:708-762 |
| GET `/employees/{id}/skills` | ADMIN, PROJECT_MANAGER, RESOURCE_MANAGER, EMPLOYEE (hanya profil sendiri) | 404 NOT_FOUND (`EMPLOYEE_SKILLS_NOT_FOUND`, juga untuk id orang lain); 422 | routes:49; openapi:764-827 |
| POST `/employees/{id}/skills` | ADMIN, RESOURCE_MANAGER | 404 NOT_FOUND (karyawan atau skill); 409 SKILL_ALREADY_ASSIGNED; 422 SKILL_INACTIVE | routes:56; openapi:828-890 |
| PATCH `/employees/{id}/skills/{skillId}` | ADMIN, RESOURCE_MANAGER | 404 NOT_FOUND (`ASSIGNMENT_NOT_FOUND`); 422 | routes:63; openapi:892-948 |
| DELETE `/employees/{id}/skills/{skillId}` | ADMIN, RESOURCE_MANAGER | 204 saat berhasil; 404 NOT_FOUND (`ASSIGNMENT_NOT_FOUND`) | routes:70; openapi:949-989 |

Catatan:
- 422 dari validasi body, params, dan query dibentuk oleh `ValidationError`, yang memakai kode `UNPROCESSABLE_ENTITY` (`common/errors/app-error.ts:38-49`).
- 422 `SKILL_REFERENCE_INVALID` hanya muncul di jalur staffing (`skills.errors.ts:70-81`, dipanggil dari `staffing.service.ts:56` dan `:93`). OpenAPI menyebutnya di `SkillAssignmentErrorResponse` (`openapi.yaml:1681-1695`).
- Paginasi: page default 1, pageSize default 20, maksimum 100 (`skills.schema.ts:62-64`, `:77-80`). Meta dibentuk `sendList` (`common/http/response.ts:19-31`).
- DELETE tidak memeriksa karyawan secara terpisah. Karyawan atau penugasan yang tidak ada sama-sama menghasilkan 404 `ASSIGNMENT_NOT_FOUND` (`skills.assignment.service.ts:224-234`). Status cocok dengan OpenAPI; pesan berbeda dari deskripsi OpenAPI.

## Entitas dan tabel

Sumber: `docs/database/erd.md` (§1, §2.3, §2.5) dan `apps/api/prisma/schema.prisma`.

- `skills` (`schema.prisma:107-119`; ERD §2.3). Kolom: `id`, `name`, `is_active` (default true), `created_by`, `updated_by`. Unique case-sensitive pada `skills_name_key` dan case-insensitive pada `skills_name_lower_key` (migrasi `20261018120000_skills_normalized_name_uniqueness`). Modul membaca, menulis (create, update), dan mengambil `FOR SHARE` saat assign.
- `employee_skills` (`schema.prisma:121-136`; ERD §2.5). Kolom: `employee_id`, `skill_id`, `proficiency_level`, kolom audit. Unique `(employee_id, skill_id)`, index `(skill_id, proficiency_level, employee_id)`. FK ke employee `ON DELETE CASCADE` dan FK ke skill `ON DELETE RESTRICT` (migrasi init, baris 234 dan 237). Modul membaca, menulis, dan menghapus.
- `employees` (`schema.prisma:84-105`; ERD §2.4). Modul hanya membaca `id` untuk memastikan karyawan ada (`skills.employee.repository.ts:33-38`). Status karyawan tidak dibaca.

Tabel `staffing_requirement_skills` (ERD §2.7) tidak disentuh modul ini; modul staffing yang memakainya.

## Aturan bisnis dan otorisasi

Rujukan ID, bukan salinan teks.

- AC01.01, AC01.02: nama wajib, di-trim, spasi internal dirapatkan, maksimum 255 (`skills.schema.ts:13-24`).
- AC01.03: nama unik secara case-insensitive. Pre-check 409 di `skills.catalog.service.ts:61-63` dan `:92-99`. Penegakan utama di database (index `lower(name)`). Unique violation dipetakan di `skills.errors.ts:34-37`.
- AC01.04: rename dan toggle aktif. Skill nonaktif tetap ada di katalog. Filter `isActive` di `skills.repository.ts:54-61`.
- AC01.05, BR02, jalur employee: skill nonaktif tidak bisa ditetapkan baru. Cek di `skills.assignment.service.ts:142-157` dalam transaksi, dengan lock `FOR SHARE` (`skills.repository.ts:119-139`) supaya tidak balapan dengan nonaktivasi.
- AC01.05, BR02, jalur staffing: `staffing.service.ts:55-57` (create, semua skill) dan `:92-98` (update, hanya skill yang baru ditambahkan). Cek lewat `assertSkillsActive` (`skills.assignment.service.ts:111-120`) tanpa lock.
- Referensi skill: id yang tidak ada atau berulang dalam satu request ditolak 422 `SKILL_REFERENCE_INVALID` (`skills.assignment.service.ts:84-100`).
- AC02.01, AC02.02, BR01: level wajib, bilangan bulat 1 sampai 5. Dijaga Zod (`skills.schema.ts:41-54`). `z.coerce` sengaja tidak dipakai.
- AC02.03: pasangan karyawan dan skill unik. Duplikat ditolak 409 `SKILL_ALREADY_ASSIGNED` (`skills.assignment.service.ts:159-166`).
- AC02.04: ubah level hanya untuk penugasan yang sudah ada (`skills.assignment.service.ts:190-218`).
- AC02.05: EMPLOYEE hanya membaca daftar sendiri; profil orang lain dijawab 404 (`skills.policy.ts:16-23`, `common/auth/policy.ts:118-146`). Tulis oleh EMPLOYEE ditolak di batas peran route.
- BR03: menghapus penugasan tidak menghapus skill (`skills.assignment.service.ts:221-223`). Penugasan ke skill nonaktif tetap terbaca dengan `skillIsActive` (`skills.views.ts:20-23`).
- AC03.01 sampai AC03.05: tidak ada aturan di modul ini. Lihat Drift nomor 1.

## Dependensi

Modul lain yang memanggil skills:
- `staffing`, lewat objek publik `skillsService` (`skills.service.ts:9-12`): `assertSkillReferencesValid` dan `assertSkillsActive` (`staffing.service.ts:8`, `:56-57`, `:93`, `:98`).

Modul yang dipanggil skills (common):
- `common/auth/policy.ts` (`assertCanAccessEmployeeProfile`, dipakai `skills.policy.ts:2`).
- `common/auth/rbac.ts` (`requireAuth`, `requireRole`, dipakai `skills.routes.ts`).
- `common/database/transaction.ts` (`withTransaction`, dipakai `skills.assignment.service.ts:2`).
- `common/database/prisma.ts` (client Prisma, dipakai dua repository).
- `common/errors/app-error.ts`, `common/errors/unique-violation.ts`, `common/http/response.ts`, `common/http/params.ts`, `common/validation/validate.ts`.
- Client Prisma yang di-generate di `apps/api/src/generated/prisma/client.js`.

Modul lain yang membaca tabel `employee_skills` tanpa lewat `skillsService`: `workforce` (lihat Drift nomor 5).

## Drift dan catatan

1. Label skala AC03.01 sampai AC03.05 tidak ada di kode atau kontrak. `apps/api/src`, `apps/web/src`, dan `docs/api/openapi.yaml` tidak memuat label Beginner sampai Expert. ERD hanya menyebut ujung skala: 1 Beginner dan 5 Expert (`docs/database/erd.md:78`, `:199`). `apps/api/prisma/seed.ts:152` dan `:169` hanya komentar. Level 2 sampai 4 tidak punya label di repo. Kartu US02.02 mengusulkan lima label termasuk "Basic" (`docs/tasks/sprint-1/US02.02.md:32`), tetapi kartunya blocked (`:27-41`).

2. DELETE penugasan adalah hard delete. Kode memanggil `prisma.employeeSkill.delete` (`skills.employee.repository.ts:129`). OpenAPI menggambarkannya sebagai penghapusan penugasan, dengan skill tetap ada (`openapi.yaml:951-955`), tanpa menyebut arsip. `schema.prisma:121-136` dan ERD §2.5 tidak punya kolom status atau `deleted_at`. `CLAUDE.md` (bagian Scope and Domain Rules) menyatakan riwayat tidak di-hard-delete. Kartu US02.02 mengutip TSD §9.3 untuk arah arsip (`docs/tasks/sprint-1/US02.02.md:23`), tetapi kartu itu blocked menunggu keputusan Tech Lead (`:9-21`) dan teks TSD tidak ada di repo. Dampak kode saat ini: kolom `created_by` dan `updated_by` baris penugasan ikut hilang. Tes `skills.test.ts:642-679` hanya memeriksa daftar kosong dan skill yang tetap ada.

3. Jalur staffing tidak terkunci. `assertSkillsActive` dipanggil tanpa lock dan tidak atomik dengan insert. Komentar di `staffing.service.ts:49-54` mengakui celah ini sampai US03.02. Jalur employee memakai `FOR SHARE` (`skills.repository.ts:131`). Daftar nama tes di `skills.test.ts` tidak memuat kasus balapan untuk jalur staffing.

4. Batas 1 sampai 5 hanya dijaga Zod. ERD menyebutnya constraint (`erd.md:199`; untuk `minimum_proficiency_level` di `erd.md:117`). Migrasi init hanya `INTEGER NOT NULL` (`migration.sql:96`, `:144`), tanpa `CHECK`. Penulisan lewat jalur lain (seed, SQL manual) tidak dijaga database.

5. Proyeksi penugasan ganda. `workforce.repository.ts:32-34` membaca `employee_skills` langsung, dan `workforce.views.ts:98-106` memetakan field yang sama seperti `skills.views.ts:24-34`. Modul skills bukan satu-satunya pembaca tabel ini, sehingga perubahan bentuk di satu sisi tidak otomatis mengikuti sisi lain.

6. Status karyawan tidak diperiksa saat penugasan. `skills.assignment.service.ts:132-136` hanya memastikan karyawan ada. OpenAPI untuk `POST /employees/{id}/skills` (`openapi.yaml:828-890`) tidak menyebut status karyawan. Apakah aturan ini perlu belum diverifikasi karena PRD tidak ada di repo.

7. Selisih kata pada `q`. OpenAPI menyebut "the same comparison that enforces uniqueness" (`openapi.yaml:631-633`). Implementasi memakai substring `contains` dengan `mode: insensitive` (`skills.repository.ts:58`), sedangkan keunikan memakai `equals` insensitive (`:146-151`) dan index `lower(name)`. Keduanya case-insensitive, tetapi pencarian bersifat substring.

8. Ukuran file. `skills.assignment.service.ts` 247 baris: di bawah batas 300 dan mendekati ambang split 250 di `CLAUDE.md`.

## Belum diverifikasi

- Teks PRD US02.02 tidak ada di repo. ID AC dan BR diambil dari kartu `docs/tasks/sprint-1/US02.02.md:3`, komentar kode, dan OpenAPI. Pemetaan AC ke kode mengikuti komentar, bukan PRD.
- Teks TSD §9.2, §9.3, §10.4, dan §12.1 tidak ada di repo. Klaim §9.3 hanya berasal dari kartu. §10.4 di `CLAUDE.md` dikaitkan dengan mutasi alokasi; kesesuaiannya untuk skills belum diverifikasi.
- Tes tidak dijalankan. Yang diperiksa adalah nama dan isi tes yang dibaca. Gate `npm run lint`, `typecheck`, `test`, dan `build` tidak dijalankan karena perubahan ini hanya dokumen.
- Perilaku SQL (escape LIKE, `FOR SHARE`, `ON DELETE`) diambil dari komentar kode, tes, dan file migrasi; tidak diuji ulang terhadap database.
- Apakah workforce menghapus karyawan secara fisik, dan efek `ON DELETE CASCADE` ke `employee_skills`: belum ditelusuri.
- Implementasi halaman web `apps/web/src/features/skills/skills-page.tsx` dan modul `resource-finder` (`resource-finder.schema.ts:13` memuat filter `skillId`): di luar lingkup.
- Aturan status karyawan saat penugasan (Drift nomor 6): belum ada sumber PRD di repo.
