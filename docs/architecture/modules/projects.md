# Modul projects

- Status: Belum Verified. Klaim tentang kode dan kontrak sudah dicek. TSD dan PRD tidak ada di repo, dan tes belum dijalankan (lihat "Belum diverifikasi").
- Pemilik: Backend (Saiful & Jundy)
- Story PRD: US03.01
- Sumber: PRD (rujuk ID story, teks tidak disalin), TSD (§9.3 sebagai konteks; file TSD tidak ada di repo), docs/api/openapi.yaml, docs/database/erd.md
- Lokasi kode: apps/api/src/modules/projects/. Dipasang di apiV1 pada `/projects` (apps/api/src/app.ts:142), jadi path lengkapnya `/api/v1/projects`.

## Tanggung jawab

- Direktori proyek: daftar dengan paginasi dan filter, serta detail proyek. Daftar belum diimplementasikan dan membalas 501.
- Pembuatan proyek oleh ADMIN atau PROJECT_MANAGER. Belum diimplementasikan dan membalas 501.
- Pembaruan proyek. Kode saat ini hanya menyimpan field `name` (lihat Drift 4).
- Penjagaan kepemilikan: PROJECT_MANAGER hanya boleh mengubah proyek yang ditugaskan kepadanya.
- Di luar modul ini: staffing requirement (`/projects/:id/staffing-requirements`, sub-router milik modul staffing yang dipasang di app.ts:143-147), allocation, dan capacity.
- Tidak ada endpoint hapus proyek, baik di kode maupun di kontrak.

## Struktur file

Folder berisi enam file TypeScript dan `.gitkeep` (0 byte, placeholder). Tidak ada `types.ts`.

- projects.routes.ts (42 baris): `projectsRouter`. `requireAuth` dipasang di seluruh router (baris 18). POST dan PATCH memakai `requireRole`.
- projects.controller.ts (81): membaca request, memanggil service, dan membentuk respons (sendList, sendSuccess, JSON 201).
- projects.service.ts (68): use case. `getProjects` dan `createProject` melempar NotImplementedError. `getProjectDetail` dan `updateProject` sudah berjalan.
- projects.repository.ts (22): akses Prisma di modul ini (`findById`, `update`).
- projects.schema.ts (60): skema Zod untuk create, update, dan query list.
- projects.policy.ts (42): helper otorisasi: `canCreate`, `canUpdate`, `canView`, `isOwner`, `assertCanUpdate`.
- .gitkeep (0 byte): placeholder.

## Endpoint

Prefix `/api/v1/projects`. Semua rute memakai `requireAuth` (projects.routes.ts:18). Middleware CSRF dipasang global (app.ts:122); isinya tidak dibahas di dokumen ini. Nomor baris merujuk ke file di folder modul, kecuali disebut lain.

| Method | Path | Peran yang boleh | Kode error utama | Kontrak (openapi.yaml) |
|---|---|---|---|---|
| GET | /projects | Semua peran terautentikasi (routes.ts:20-24) | 401 UNAUTHORIZED; 422 UNPROCESSABLE_ENTITY (query); 501 NOT_IMPLEMENTED (service.ts:20-22) | 200, 401, 422, 501 (baris 991-1026) |
| POST | /projects | ADMIN, PROJECT_MANAGER (routes.ts:27) | 401; 403 FORBIDDEN; 422; 501 NOT_IMPLEMENTED (service.ts:29-31) | 201, 401, 403, 422, 501 (baris 1027-1055) |
| GET | /projects/{id} | Semua peran terautentikasi (routes.ts:31-35; common/auth/policy.ts:195-200) | 401; 404 NOT_FOUND (service.ts:39-41); 422 (uuidParamSchema) | 200, 401, 404, 422 (baris 1057-1080) |
| PATCH | /projects/{id} | ADMIN, PROJECT_MANAGER (routes.ts:38). ADMIN untuk semua proyek. PM hanya untuk proyeknya. Selain itu 404 (service.ts:55; common/auth/policy.ts:181-189) | 401; 403 FORBIDDEN (requireRole); 404 NOT_FOUND; 422 | 200, 401, 403, 404, 422 (baris 1081-1114) |

Kode error berasal dari common/errors/app-error.ts:62-114. Respons GET detail dan PATCH tidak sesuai kontrak. Lihat Drift 1 dan 3.

## Entitas dan tabel

Modul ini hanya menyentuh tabel `projects` (erd.md §2.6; diagram di erd.md:85-97).

- `projects`: dibaca dengan `findUnique` tanpa select atau include (projects.repository.ts:6-10). Kolom yang ditulis hanya `name` dan `updated_by` (projects.repository.ts:13-21; projects.service.ts:57-60). `updated_by` diisi dengan `user.id`.
- Kolom `project_code`, `project_manager_employee_id`, `start_date`, `end_date`, dan `status` dibaca apa adanya oleh detail. Kode saat ini tidak menulisnya.
- `created_by` belum diisi karena create belum diimplementasikan.
- `employees` (erd.md §2.4; relasi `manages` di erd.md:146) tidak di-join. Modul hanya membandingkan `project_manager_employee_id` dengan `user.employeeId` (common/auth/policy.ts:151-163). Relasi FK ada di schema.prisma:142-143.
- Tidak disentuh modul ini: `staffing_requirements` (erd.md §2.7) dan `allocations` (erd.md §2.8). Kontrak detail memintanya, tetapi kode tidak memuatnya (Drift 1).
- ERD §2.6 mencantumkan aturan tanggal, tetapi tidak menyebut apakah aturan itu wajib di DB. Migrasi init tidak memuat CHECK. Aturan `end_date >= start_date` hanya dijaga di Zod (projects.schema.ts; lihat Drift 11).

## Aturan bisnis dan otorisasi

Repo belum memetakan ID BR atau AC untuk proyek. Traceability hanya mencatat US03.01 sebagai "Belum dipetakan" (docs/quality/traceability.md:44). Karena itu bagian ini merujuk perilaku kode dan kontrak, tanpa ID BR atau AC.

- Pembuatan: hanya ADMIN dan PROJECT_MANAGER (routes.ts:27). Helper `canCreate` dengan aturan yang sama tidak dipakai rute (projects.policy.ts:10-12; Drift 12). Status awal default `DRAFT` (projects.schema.ts:14-16).
- Status: lima nilai (projects.schema.ts:15, 36, 55). Tidak ada aturan transisi status di kode.
- Tanggal: format `YYYY-MM-DD` (projects.schema.ts:8-13). `endDate` tidak boleh sebelum `startDate`. Aturan ini dicek saat create dan saat update yang membawa keduanya (projects.schema.ts:18-21, 39-50).
- Ubah proyek: ADMIN mengubah proyek mana pun. PROJECT_MANAGER hanya proyek yang `project_manager_employee_id`-nya sama dengan `user.employeeId` (common/auth/policy.ts:151-176). Proyek milik PM lain dibalas 404 "Project not found.", sama dengan proyek yang tidak ada (common/auth/policy.ts:181-189; authorization.test.ts:415-434).
- Lihat detail dan daftar: tidak ada pembatasan peran atau kepemilikan. `canViewProject` selalu true (common/auth/policy.ts:195-200). Service tidak memakai argumen user di detail (projects.service.ts:36).
- Audit: `updated_by` diisi `user.id` saat update (projects.service.ts:59). `created_by` belum diisi.
- Riwayat: tidak ada endpoint hapus. Menurut CLAUDE.md, data historis tidak di-hard-delete.

## Dependensi

- Modul lain yang dipanggil: tidak ada. Pencarian di apps/api/src tidak menemukan modul lain yang mengimpor `projects.service` atau `projects.repository`.
- Common (bukan modul domain):
  - `common/auth/rbac.ts`: `requireAuth`, `requireRole`.
  - `common/auth/policy.ts`: `assertAuth` (controller), `canManageProject`, `assertCanManageProject`, `canViewProject`, `isProjectManagerOwner` (diimpor di projects.policy.ts:1-7).
  - `common/auth/types.ts`: tipe `AuthenticatedUser`.
  - `common/validation/validate.ts`: `validateBody`, `validateQuery`, `validateParams`, `uuidParamSchema`.
  - `common/errors/app-error.ts`, `common/http/params.ts`, `common/http/response.ts`, `common/database/prisma.ts` (repository).
  - `src/generated/prisma/client.js`: tipe `Project`.
- Tabel `projects` juga dibaca langsung lewat Prisma oleh modul lain, bukan lewat service projects: allocations.repository.ts:22-23 dan staffing.repository.ts:45-46 (`findProjectById`). Lihat Drift 15.

## Drift dan catatan

Status proyek (pemeriksaan khusus):

- Kode, Prisma, migrasi, ERD, dan OpenAPI memakai lima nilai: DRAFT, PLANNED, ACTIVE, COMPLETED, ARCHIVED. Sumber: projects.schema.ts:15, 36, 55; schema.prisma:22-28; prisma/migrations/20261005113838_init/migration.sql:8; erd.md:92, 210; openapi.yaml:1003, 2070, 2082, 2105. docs/architecture/overview.md:58 juga memuat kelima nilai.
- Klaim tugas: TSD §9.3 hanya menyebut PLANNED, ACTIVE, COMPLETED, ARCHIVED. File TSD tidak ada di repo, jadi klaim ini belum bisa dicek. Di repo, §9.3 dirujuk untuk status alokasi (erd.md:235) dan retensi riwayat (docs/tasks/sprint-1/US02.02.md:23), bukan status proyek. DRAFT dicatat sebagai selisih antara kode dan kontrak di satu sisi dengan TSD di sisi lain. Keputusannya ada pada Tech Lead.

Kode vs kontrak:

1. GET /projects/{id}: kontrak ProjectDetail memuat `staffingRequirements` dan `allocations` (openapi.yaml:2109-2121). Kode hanya mengembalikan baris `projects` (projects.repository.ts:6-10; projects.service.ts:42).
2. Field Project: kontrak memuat `projectManagerName`, `staffingRequirementCount`, dan `allocatedResourceCount` (openapi.yaml:2101, 2106-2107). Kode tidak menghasilkan ketiganya.
3. PATCH respons: kontrak mengembalikan Project (openapi.yaml:1098-1106). Kode mengembalikan `{ id, name, status }` (projects.service.ts:62-66).
4. PATCH diam-diam mengabaikan field: UpdateProjectInput menerima `projectManagerEmployeeId`, `startDate`, `endDate`, dan `status` (projects.schema.ts:23-38; openapi.yaml:2074-2083). Service hanya menerapkan `name` (projects.service.ts:57-60). Akibatnya PATCH `{ "status": "ARCHIVED" }` membalas 200 dengan status lama. Tes tidak mencakup kasus ini (authorization.test.ts:399-412 hanya mengirim `name`).
5. Create: kontrak mewajibkan `projectManagerEmployeeId` dan `status` (openapi.yaml:2052-2060). Kode membuatnya opsional dan memberi default `DRAFT` (projects.schema.ts:7, 14-16). Tes authorization.test.ts:637-650 mengirim POST tanpa PM dan mengharapkan 501, jadi tes mengikuti kode, bukan kontrak.
6. Create vs DB: kolom `project_manager_employee_id` wajib di Prisma (schema.prisma:142), tetapi skema Zod membuatnya opsional (projects.schema.ts:7). Jika create diimplementasikan seperti sekarang, nilai kosong akan gagal di DB.
7. Respons create: controller menyiapkan 201 dengan meta "Create project scaffold..." (projects.controller.ts:34-39). Jalur ini tidak pernah tercapai karena service selalu melempar 501 (projects.service.ts:29-31).
8. Format tanggal: kontrak memakai `format: date` (openapi.yaml:2065-2066). Prisma mengembalikan kolom `@db.Date` sebagai `Date`, dan modul ini tidak memformatnya (projects.controller.ts:57; projects.service.ts:42). Modul lain memakai `toDateString` (capacity.service.ts:7; workforce.views.ts:35). Dugaan: JSON memuat string ISO datetime. Belum dijalankan.
9. Query list: kode membatasi `page` minimal 1 dan `pageSize` 1-100 (projects.schema.ts:58-59). Kontrak tidak menulis batas ini (openapi.yaml:1008-1013). Kode lebih ketat dari kontrak.
10. Struktur: CLAUDE.md menyebut `types.ts` sebagai bagian pola modul. Modul ini tidak memilikinya. Perlu keputusan, tidak diubah di dokumen ini.

Catatan kode internal:

11. Aturan tanggal hanya di Zod: refine pada update hanya berjalan jika `startDate` dan `endDate` sama-sama ada (projects.schema.ts:39-50). Saat ini tidak berdampak karena service tidak menulis tanggal. Celah ini muncul begitu tanggal diimplementasikan.
12. Helper policy tidak dipakai rute: `canCreate`, `canUpdate`, `canView`, `isOwner` (projects.policy.ts:10-33). Pembuatan dijaga `requireRole` (routes.ts:27). Service hanya memakai `assertCanUpdate` (projects.service.ts:55). Helper lain hanya dipanggil di tes (authorization.test.ts:1095-1102).
13. Komentar basi: "TODO: Add update method here" (projects.repository.ts:12), padahal method `update` sudah ada (baris 13-21).
14. Check lalu update tanpa transaksi: `findById` (projects.service.ts:50) lalu `update` (projects.service.ts:57), tanpa transaksi atau `SELECT ... FOR UPDATE`. CLAUDE.md dan ADR-009 (docs/architecture/decisions/adr-009-allocation-concurrency-row-lock.md) mewajibkan kunci baris untuk mutasi alokasi. Keduanya tidak menyebut mutasi proyek.
15. Akses tabel lintas modul: allocations.repository.ts dan staffing.repository.ts membaca `projects` langsung lewat Prisma. CLAUDE.md meminta modul berkomunikasi lewat service publik. Perlu keputusan Tech Lead.

## Belum diverifikasi

- Tes belum dijalankan. Tes yang menyentuh projects ada di apps/api/tests/authorization.test.ts (baris 266-270, 398-434, 616-650, 1095-1107, 1487-1492). Tes ini butuh PostgreSQL. Dokumen ini hanya membaca isinya.
- Dugaan format tanggal JSON (Drift 8) belum dijalankan. Perlu satu request nyata atau tes.
- TSD tidak ada di repo. Klaim §9.3 soal status proyek tidak bisa dicek. Dokumen ini tidak merujuk nomor TSD lain.
- PRD tidak ada di repo. Acceptance criteria US03.01 belum dipetakan ke ID AC atau BR, sehingga tidak ada ID yang dikutip.
- Isi middleware CSRF (common/auth/csrf.ts) belum dibaca.
- Konsumsi frontend (apps/web/src/features/projects/, apps/web/src/api/schema.d.ts) belum dicek terhadap bentuk respons.
- Seed data proyek (apps/api/prisma/seed.ts) belum dicek.
- Kontrak belum divalidasi dengan generator (`npm run api:types`) atau pemeriksa OpenAPI.
- Gate kualitas (lint, typecheck, test, build) tidak dijalankan. Perubahannya hanya dokumen. Tidak ada commit dan tidak ada push.
