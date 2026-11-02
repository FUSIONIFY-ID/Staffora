# Modul Staffing

- Status: Belum Verified. Klaim tentang kode dan kontrak (OpenAPI, ERD) sudah dicek. Teks PRD dan TSD tidak ada di repo, dan tes belum dijalankan (lihat "Belum diverifikasi").
- Pemilik: Backend (Saiful & Jundy)
- Story PRD: US03.02
- Sumber: PRD (rujuk ID story, teks tidak disalin), TSD (rujuk nomor bagian §9.2 sebagai konteks; teks tidak ada di repo), docs/api/openapi.yaml, docs/database/erd.md. Pelengkap: apps/api/prisma/schema.prisma dan migrasi init.

## Tanggung jawab

- Mengelola kebutuhan staffing per project: daftar, buat, dan ubah baris `staffing_requirements` beserta daftar skill yang dibutuhkan di `staffing_requirement_skills`.
- Menerapkan guard skill saat skill dilampirkan (AC01.05, BR02): skill harus ada, tidak boleh berulang dalam satu request, dan skill nonaktif tidak boleh dilampirkan sebagai baru. Pengecekan itu didelegasikan ke modul skills.
- Membatasi mutasi kepada ADMIN dan PROJECT_MANAGER yang menjadi pemilik project.
- Penghapusan belum diimplementasikan. Endpoint DELETE selalu menjawab 501.
- Di luar tanggung jawab: kapasitas, alokasi, dan tabel `allocations`. Modul ini tidak menulis tabel tersebut.

## Struktur file

Folder: `apps/api/src/modules/staffing/`. Semua file di bawah 250 baris; yang terpanjang `staffing.repository.ts` (198 baris).

- `staffing.routes.ts` (42 baris): dua router. `projectStaffingRouter` untuk GET dan POST di `/projects/:id/staffing-requirements`; `staffingRouter` untuk PATCH dan DELETE di `/staffing-requirements/:id`. Mount di `app.ts:143-148`.
- `staffing.controller.ts` (78 baris): membaca params dan body, memanggil service, memformat respons. Tidak ada akses database.
- `staffing.service.ts` (119 baris): use case, pengecekan project dan kepemilikan, guard skill.
- `staffing.repository.ts` (198 baris): satu-satunya akses Prisma modul ini. Tipe hasil ada di baris 4-32; modul ini tidak punya `types.ts`.
- `staffing.schema.ts` (56 baris): skema Zod untuk body create dan update, termasuk bentuk array `skills`.
- `staffing.policy.ts` (22 baris): pembungkus asersi kepemilikan project dari `common/auth/policy.ts`.
- `.gitkeep`: placeholder yang masih ada meski folder sudah berisi file.

## Endpoint

Semua route memakai `requireAuth()` (`staffing.routes.ts:16`, `:28`). POST, PATCH, dan DELETE juga wajib header `X-CSRF-Token` (`app.ts:122`; `docs/api/openapi.yaml:1651-1655`).

| Method | Path | Peran yang boleh | Kode error utama |
|---|---|---|---|
| GET | /api/v1/projects/{id}/staffing-requirements | Semua peran yang login. Tidak ada pembatasan (`routes.ts:18`) | 401; 404 "Project not found." (`service.ts:23-25`); 422 jika id bukan UUID (`app.ts:145`) |
| POST | /api/v1/projects/{id}/staffing-requirements | ADMIN; PROJECT_MANAGER pemilik project (`routes.ts:21`) | 401; 403 jika peran tidak diizinkan; 404 jika project tidak ada atau PM bukan pemilik (`service.ts:34-42`); 422 validasi body; 422 SKILL_REFERENCE_INVALID; 422 SKILL_INACTIVE |
| PATCH | /api/v1/staffing-requirements/{id} | ADMIN; PROJECT_MANAGER pemilik project (`routes.ts:32`) | 401; 403; 404 jika requirement tidak ada atau PM bukan pemilik (`service.ts:76-84`); 422 id atau body; 422 SKILL_REFERENCE_INVALID; 422 SKILL_INACTIVE hanya untuk skill yang baru ditambahkan |
| DELETE | /api/v1/staffing-requirements/{id} | ADMIN; PROJECT_MANAGER (`routes.ts:39`), lalu selalu 501 | 401; 403; 422 id; 501 NOT_IMPLEMENTED (`service.ts:111-118`) |

Catatan:
- Respons sukses: 200 untuk GET dan PATCH, 201 untuk POST (`controller.ts:39`), 204 untuk DELETE tidak pernah tercapai (lihat Drift 8).
- 422 validasi umum memakai `code` `UNPROCESSABLE_ENTITY` (`common/errors/app-error.ts:46`). Kontrak tidak menyebut nilai ini.
- SKILL_INACTIVE membawa `errors.skillId`; SKILL_REFERENCE_INVALID membawa `errors.skills` (`skills.errors.ts:54-81`).

## Entitas dan tabel

Dari `docs/database/erd.md` bagian 2.6 dan 2.7 dan dari `schema.prisma`. Migrasi yang dirujuk di bawah ada di `apps/api/prisma/migrations/20261005113838_init/migration.sql` (disebut `migration.sql`).

- `staffing_requirements` (ditulis). ERD `erd.md:99-111`; Prisma `schema.prisma:158-177`. Kolom bisnis: project_id, job_role_id, headcount, allocation_percentage, start_date, end_date, ditambah kolom audit.
- `staffing_requirement_skills` (ditulis). ERD `erd.md:113-122`; Prisma `schema.prisma:179-193`. Unik (staffing_requirement_id, skill_id) di migrasi init (`migration.sql:216`). FK ke requirement ON DELETE CASCADE, FK ke skills ON DELETE RESTRICT (`migration.sql:249`, `:252`).
- `projects` (dibaca, tidak ditulis). ERD `erd.md:85-97`; Prisma `schema.prisma:138-156`. Dipakai untuk keberadaan project dan `project_manager_employee_id` pada otorisasi.
- `job_roles` (dibaca lewat relasi `include`). Prisma `schema.prisma:69-82`. Tidak ada pengecekan keberadaan di kode (lihat Drift 5).
- `skills` (dibaca lewat modul skills). Prisma `schema.prisma:107-119`; kolom `is_active` dipakai guard. Tidak ditulis.
- `allocations` (hanya relasi). FK `staffing_requirement_id` ON DELETE SET NULL (`migration.sql:264`). Tidak ditulis modul ini.

Batas di tingkat database: tidak ditemukan CHECK constraint di folder `apps/api/prisma`. Aturan headcount, allocation_percentage, dan minimum_proficiency_level hanya dijaga Zod (`staffing.schema.ts:14`, `:21`, `:22-26`). ERD menyebutnya sebagai constraint (`erd.md:103-104`, `:117`, `:217-218`).

## Aturan bisnis dan otorisasi

- US03.02 adalah story acuan modul. Teks dan AC US03.02 tidak ada di repo. Kode hanya mengutip AC01.05 dan BR02 (`staffing.service.ts:44`, `:86`), yang berasal dari kartu US02.02.
- AC01.05 / BR02: skill harus ada dan tidak boleh berulang dalam satu request. Skill nonaktif tidak boleh dilampirkan sebagai baru. Create memeriksa semua skill (`staffing.service.ts:55-57`). Update hanya memeriksa skill yang belum terpasang (`staffing.service.ts:92-98`).
- Otorisasi mutasi: peran ADMIN, atau PROJECT_MANAGER yang `projectManagerEmployeeId`-nya sama dengan pemilik project (`common/auth/policy.ts:170-176`). Peran lain mendapat 403 dari `requireRole` (`common/auth/rbac.ts:27-45`). PM yang bukan pemilik mendapat 404 (`common/auth/policy.ts:181-189`).
- BR-G15: penghapusan fisik dinonaktifkan (`docs/api/openapi.yaml:1229`).
- Tanggal requirement harus berada dalam periode project (ERD bagian 2.7, `erd.md:219`). Belum dijaga kode (lihat Drift 2).
- Requirement dan skill-nya ditulis dalam satu transaksi (`staffing.repository.ts:93-121`). PATCH dengan `skills` terdefinisi menghapus semua skill lama lalu membuat ulang dalam satu transaksi (`staffing.repository.ts:136-141`).

## Dependensi

- Modul skills, lewat `skillsService` (`apps/api/src/modules/skills/skills.service.ts:9-12`): `assertSkillReferencesValid` (`skills.assignment.service.ts:84`) dan `assertSkillsActive` (`skills.assignment.service.ts:111`). Error `SkillReferenceError` dan `SkillInactiveError` dilempar dari sana (`skills.errors.ts:54-81`).
- Modul projects: tidak ada pemanggilan layanan. Keberadaan project dicek langsung lewat Prisma di repository (`staffing.repository.ts:44-48`).
- `common/auth`: `requireAuth`, `requireRole` (`rbac.ts`), `assertAuth` (`staffing.controller.ts:3`), `assertCanManageProject` (`policy.ts:181-189`).
- `common/validation`: `validateBody`, `validateParams`, `uuidParamSchema` (`validate.ts:5`, `:25-39`, `:61-83`).
- `common/http` (`getParam`, `sendSuccess`, `sendCreated`, `sendNoContent`) dan `common/errors` (`NotFoundError`, `NotImplementedError`, `app-error.ts:74-78`, `:111-115`).
- Client Prisma: `common/database/prisma.ts` dan `generated/prisma/client.js` (`staffing.repository.ts:1-2`).
- Pemanggil dari luar modul: hanya `app.ts` dan berkas tes. Tidak ditemukan modul lain yang memanggil `staffingService`.

## Drift dan catatan

1. Bentuk respons tidak sesuai kontrak. OpenAPI `StaffingRequirement` (`openapi.yaml:2185-2218`) mewajibkan `jobRoleTitle`, `filledHeadcount`, dan `status` (OPEN atau FULFILLED), serta `skills[].skillName`. Kode mengembalikan baris Prisma dengan relasi `jobRole` dan `skills[].skill` (`staffing.repository.ts:63-77`, `:83-122`, `:124-197`). Tidak ada kolom `filledHeadcount` atau `status` di Prisma (`schema.prisma:158-177`), dan tidak ditemukan kode yang menghitungnya di `apps/api/src`. Tipe web hasil generate (`apps/web/src/api/schema.d.ts:2474-2489`) ikut memuat field itu.
2. Tanggal tidak dijaga terhadap periode project. ERD `erd.md:219` mewajibkan tanggal berada di dalam `[start_date, end_date]` project. Service hanya memastikan project ada (`staffing.service.ts:34-37`). Skema hanya memeriksa format regex (`staffing.schema.ts:27-32`, `:40-46`). Urutan start dan end requirement juga tidak diperiksa. ERD menyebut aturan urutan hanya untuk projects (`erd.md:91`, `:209`).
3. Guard skill tidak atomik, pada create dan PATCH. Create: `assertSkillReferencesValid` dan `assertSkillsActive` berjalan di `staffing.service.ts:55-57`, sebelum `staffingRepository.create`. Transaksi di repository (`staffing.repository.ts:93`) hanya membungkus insert, tanpa lock. Jalur employee mengunci skill dengan `FOR SHARE` di dalam transaksi yang sama dengan insert (`skills.assignment.service.ts:142-148`; `skills.repository.ts:119-131`). Komentar `staffing.service.ts:49-54` mengakui celah ini sampai US03.02. PATCH: skill "baru" ditentukan dari baca di `staffing.service.ts:94-98` dan `staffing.repository.ts:55-61` di luar transaksi, sedangkan tulisnya di `staffing.repository.ts:136-175`. Jendela race-nya sama.
4. Cakupan tes. Guard skill staffing diuji di `apps/api/tests/skills.test.ts:477-557` (skill nonaktif) dan `:1207-1275` (id tidak dikenal dan berulang). Tidak ada tes konkurensi untuk jalur staffing. Tes lock F13 (`skills.test.ts:1633-1695`) hanya untuk jalur assignment employee. Tidak ada berkas tes khusus modul staffing. `authorization.test.ts:37` dan `:40` mengimpor `staffingPolicy` dan `staffingService`.
5. `jobRoleId` tidak diperiksa keberadaannya. Zod hanya memeriksa UUID (`staffing.schema.ts:20`), dan service tidak membaca `job_roles` (`staffing.service.ts:59-68`). `unique-violation.ts:64-65` hanya memetakan P2002. Pelanggaran FK jatuh ke respons 500 generik (`common/errors/error-handler.ts:32-40`). Kontrak tidak mendokumentasikan kasus ini.
6. GET tidak membatasi peran atau kepemilikan. `routes.ts:16-18` hanya `requireAuth`, dan `service.ts:19-27` hanya memastikan project ada. Pola ini sejalan dengan `canViewProject` yang selalu true (`common/auth/policy.ts:195-199`). Kontrak tidak menyebut peran untuk GET.
7. PM bukan pemilik mendapat 404, bukan 403 (`staffing.service.ts:38-42`, `:80-84`). Kontrak menulis 403 untuk RBAC dan 404 untuk not found (`openapi.yaml:1176-1179`, `:1221-1224`), tanpa menyebut kasus ini.
8. Kode mati di DELETE. `staffing.service.ts:111-118` selalu melempar NotImplementedError, sehingga `sendNoContent` di `staffing.controller.ts:73` tidak tercapai. Kontrak untuk 501 sudah sesuai (`openapi.yaml:1227-1250`). CLAUDE.md melarang dead code.
9. Akses project langsung. `staffing.repository.ts:44-48` membaca tabel `projects` lewat Prisma, tidak lewat modul projects. Pencarian di `projects.service.ts` hanya menemukan `getProjects` dan `getProjectDetail`. Apakah ini melanggar aturan batas modul di CLAUDE.md adalah keputusan Tech Lead.
10. Struktur file. Modul memakai prefiks `staffing.*.ts` dan tidak punya `types.ts`. CLAUDE.md menulis `routes.ts`, `controller.ts`, dan seterusnya. Modul skills memakai pola prefiks yang sama.
11. Traceability. `docs/quality/traceability.md:45` masih menulis "Belum dipetakan" untuk US03.02.
12. Sudah konsisten, tidak perlu diperiksa ulang: kode SKILL_INACTIVE dan `errors.skillId` (`skills.errors.ts:54-60` dan `openapi.yaml:2149`, `:2176`), kode SKILL_REFERENCE_INVALID dan `errors.skills` (`skills.errors.ts:70-81` dan `openapi.yaml:2147-2148`, `:2172-2173`), serta perilaku skills kosong pada PATCH (`staffing.repository.ts:136-141` dan `openapi.yaml:1188`).

## Belum diverifikasi

- Teks PRD dan AC untuk US03.02 tidak ada di repo. ID US03.02 hanya berasal dari `docs/quality/traceability.md:45`.
- Teks TSD §9.2 tidak ada di repo (`docs/README.md:10` hanya menyebut namanya). Nomor §9.2 berasal dari permintaan dan kartu `docs/tasks/sprint-1/US02.02.md:3`. Isinya tidak dibaca.
- Tes tidak dijalankan. Gate `npm run lint`, `typecheck`, `test`, dan `build` tidak dijalankan. Yang dibaca hanya nama dan isi tes.
- Perilaku runtime belum diuji: 500 untuk `jobRoleId` yang tidak dikenal (dugaan dari FK dan error handler), serialisasi `startDate` dan `endDate` (Prisma `Date` menjadi ISO datetime, sedangkan kontrak menulis `format: date`), dan race condition pada guard skill.
- Apakah GET boleh untuk semua peran belum dipastikan dari PRD.
- Penggunaan endpoint staffing di `apps/web` belum diperiksa.
- Keputusan apakah pengecekan project perlu lewat service modul projects belum ada.
