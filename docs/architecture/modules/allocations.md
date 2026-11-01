# Modul allocations

- Status: Belum Verified. Klaim tentang kode dan kontrak sudah dicek. TSD dan PRD tidak ada di repo, dan tes serta gate build belum dijalankan (lihat "Belum diverifikasi").
- Pemilik: Backend (Saiful & Jundy)
- Story PRD: US04.01, US04.02
- Sumber: PRD (rujuk ID story), TSD (rujuk nomor bagian), docs/api/openapi.yaml, docs/database/erd.md. ADR-009 dirujuk untuk aturan lock.
- Lokasi kode: apps/api/src/modules/allocations/
- Path di bawah relatif terhadap router apiV1 (app.ts:149). apiV1 dipasang di /api/v1 (app.ts:155).

## Tanggung jawab

- Penugasan karyawan ke proyek: pembuatan, pembaruan (persentase, job role, rentang tanggal), pengakhiran lebih awal (`/end`), dan pembatalan (`/cancel`). Kontrak: openapi.yaml:1252-1480.
- Saat ini hanya lapisan HTTP, validasi input (Zod), dan pemeriksaan akses yang berjalan. Setelah pemeriksaan, create, update, end, dan cancel berhenti di `NotImplementedError` (501). List dan detail langsung 501. Lihat Drift 1 dan 2.
- Pemeriksaan akses per proyek: ADMIN dan RESOURCE_MANAGER untuk semua proyek, PROJECT_MANAGER hanya untuk proyek yang ia kelola. Pelanggaran menghasilkan 404 (non-disclosure).
- Penjagaan kapasitas (total alokasi per karyawan tidak melebihi 100% pada tanggal mana pun) seharusnya dilakukan di modul ini lewat lock dan engine kapasitas (ADR-009). Belum ada di kode.
- Tidak ada penghapusan fisik. Modul tidak punya route DELETE.

## Struktur file

Folder berisi enam file TypeScript dan `.gitkeep` (placeholder).

- allocations.routes.ts: router Express. `requireAuth` di semua rute, `requireRole` pada mutasi, lalu `validateParams` dan `validateBody`.
- allocations.controller.ts: membaca request, memanggil service, dan memberi bentuk respons (`sendSuccess`, `sendList`, `sendCreated`, `sendNoContent`). Cancel mengembalikan 204.
- allocations.service.ts: use case. Lookup, pemeriksaan kepemilikan proyek, lalu throw `NotImplementedError` untuk create, update, end, dan cancel. List dan detail langsung 501.
- allocations.repository.ts: satu-satunya akses Prisma di modul. `findById` (allocation beserta project) dan `findProjectById`.
- allocations.policy.ts: objek `allocationsPolicy` (dipakai tes saja) dan re-export `assertCanManageAllocation`.
- allocations.schema.ts: skema Zod untuk create, update, dan end, beserta tipe input.
- .gitkeep: placeholder.

## Endpoint

Path relatif terhadap /api/v1. Peran dari allocations.routes.ts. Kode error dari common/errors/app-error.ts dan service. Semua mutasi melewati CSRF global (app.ts:122, csrf.ts:22-39) sebelum `requireAuth`, sehingga request tanpa token menerima 403 meski belum login.

| Metode | Path | Peran yang boleh | Kode error utama |
| --- | --- | --- | --- |
| GET | /allocations | Semua peran terautentikasi. Tanpa requireRole (routes.ts:19). | 401 UNAUTHORIZED. 501 NOT_IMPLEMENTED (service.ts:24). 403 di kontrak (openapi.yaml:1279) belum dihasilkan. |
| GET | /allocations/{id} | Semua peran terautentikasi (routes.ts:20-24). | 401. 422 UNPROCESSABLE_ENTITY untuk UUID tidak valid (validate.ts:5-7). 501 (service.ts:33). 403 dan 404 di kontrak belum dihasilkan. |
| POST | /allocations | ADMIN, PROJECT_MANAGER, RESOURCE_MANAGER (routes.ts:28). PM hanya proyek sendiri. | 401. 403 FORBIDDEN (rbac.ts:36-41). 422 (schema.ts:3-24). 404 "Project not found." (service.ts:43-51). 501 (service.ts:53). 409 CAPACITY_CONFLICT di kontrak (openapi.yaml:1313-1318) belum dihasilkan. |
| PATCH | /allocations/{id} | Sama seperti POST (routes.ts:35). | 401. 403. 422 (schema.ts:26-50). 404 "Allocation not found." (service.ts:63-71). 501 (service.ts:72). 409 di kontrak belum dihasilkan. |
| POST | /allocations/{id}/end | Sama seperti POST (routes.ts:43). | 401. 403. 422 (schema.ts:52-56). 404 (service.ts:82-90). 501 (service.ts:91). |
| POST | /allocations/{id}/cancel | Sama seperti POST (routes.ts:51). | 401. 403. 422 dari validateParams (routes.ts:52). 404 (service.ts:97-105). 501 (service.ts:106). Respons sukses tidak tercapai (Drift 4). |

Urutan middleware pada mutasi: CSRF (app.ts:122), `requireAuth` (routes.ts:17), `requireRole` (routes.ts:28, 35, 43, 51), `validateParams`, `validateBody`, controller, service. Akibatnya, EMPLOYEE yang mengirim body tidak valid menerima 403, bukan 422.

## Entitas dan tabel

Sumber: docs/database/erd.md bagian 2.8 dan 3, apps/api/prisma/schema.prisma:195-219, migration 20261005113838_init (migration.sql:154-170, 219-222, 255-267).

- allocations (ERD 2.8): dibaca lewat `findById` (repository.ts:13-20). Belum ditulis, karena mutasi belum ada. Kolom yang disentuh: id, employee_id, project_id, job_role_id, staffing_requirement_id, allocation_percentage, start_date, end_date, cancelled_at, cancelled_by. Kolom dan relasinya cocok antara ERD dan schema.prisma. Indeks (employee_id, start_date, end_date) dan (project_id, start_date, end_date) ada di migration. Tidak ada CHECK constraint (Drift 7).
- projects (ERD 2.6): dibaca lewat `findProjectById` (repository.ts:22-26) dan sebagai include pada `findById` (repository.ts:16-18). Kolom yang dipakai: id, project_manager_employee_id.
- employees (ERD 2.4): tidak diakses. Lock baris employees yang diminta ADR-009 belum ada (Drift 1).
- users (ERD 2.1): tidak diakses. Kolom cancelled_by (FK ke users.id, ON DELETE SET NULL) belum ditulis.
- job_roles (ERD 2.3) dan staffing_requirements (ERD 2.7): hanya FK di tabel allocations. Keberadaannya belum diperiksa service (Drift 10).

## Aturan bisnis dan otorisasi

Rujuk ID. Teks tidak disalin.

- Total alokasi per karyawan tidak boleh melebihi 100% pada tanggal mana pun (BR-G07 dan BR-G18, dikutip di ADR-009). Belum ditegakkan di kode modul (Drift 1 dan 2).
- Alokasi berurutan tidak dijumlahkan sebagai beban bersamaan (BR-G17, TSD 10.3, docs/CODING_STANDARD.md bagian 6). Penghitungan ada di modul capacity, bukan di modul ini.
- Riwayat tidak dihapus fisik (docs/CODING_STANDARD.md bagian 5). Modul tidak punya DELETE.
- Status tampilan PLANNED, ACTIVE, ENDED, dan CANCELLED dihitung saat dibaca, tanpa cron (ERD bagian 3). Belum ada kode di folder modul yang menghitungnya (Drift 9).
- Tanggal: create dan update memakai format YYYY-MM-DD (schema.ts:16, 19, 32, 36). endDate tidak boleh sebelum startDate (schema.ts:21-24, 39-50). Pada PATCH, pemeriksaan urutan hanya berjalan bila kedua tanggal dikirim.
- Rentang tanggal alokasi harus berada di dalam rentang proyek (ERD 2.8). Service belum memeriksanya.
- Persentase 1 sampai 100 (schema.ts:9-13, 29). Ditegakkan hanya di Zod, bukan di database (Drift 7).
- Otorisasi mutasi: peran dari routes.ts. ADMIN dan RESOURCE_MANAGER mengelola alokasi di proyek mana pun. PROJECT_MANAGER hanya bila `user.employeeId` sama dengan `projectManagerEmployeeId` proyek (common/auth/policy.ts:151-163, 207-214). Pelanggaran menghasilkan 404, bukan 403 (common/auth/policy.ts:219-227).
- Otorisasi baca: GET tidak membatasi peran (routes.ts:19-24). Audit docs/audits/ROUND-6_BE-S1-US01-RBAC-Authorization-Foundation_REQUEST-CHANGES_2026-10-14.md meminta `requireRole` ditambahkan saat US04 diimplementasikan. Keputusan peran baca belum dibuat (Drift 6).
- Konkurensi: belum ada. Lihat catatan lock di Drift.

## Dependensi

- common/auth: `requireAuth` dan `requireRole` (rbac.ts:10-45). `assertCanManageAllocation` (common/auth/policy.ts:219-227), diimpor langsung di allocations.policy.ts:2-5.
- common/errors: `NotFoundError` dan `NotImplementedError` (app-error.ts:74-78, 111-115).
- common/validation: `validateBody`, `validateParams`, `uuidParamSchema` (validate.ts). `validateQuery` tidak dipakai.
- common/http: `sendSuccess`, `sendList`, `sendCreated`, `sendNoContent` (response.ts), dan `getParam` (params.ts).
- common/database/prisma: hanya lewat allocations.repository.ts.
- Modul lain: tidak ada pemanggilan service modul lain. Modul capacity tidak diimpor, padahal CLAUDE.md menjadikan CapacityService sumber tunggal perhitungan kapasitas. File capacity.service.ts mengekspor fungsi `evaluateCapacity` (capacity.service.ts:41), bukan objek CapacityService. Modul projects tidak dipanggil. Repository membaca tabel projects langsung (repository.ts:22-26). Ini tidak melanggar aturan repository per modul, tetapi tidak lewat service publik projects.

## Drift dan catatan

Kode dianggap benar kecuali disebut lain. Prioritas tinggi berkaitan dengan integritas kapasitas.

**Hasil pemeriksaan lock (ADR-009): tidak ada.** Tidak ada `$transaction`, `withTransaction`, atau `SELECT ... FOR UPDATE` di folder modul. Tidak ada lock pada baris employees di modul ini. Fungsi yang seharusnya memakainya adalah `createAllocation` (service.ts:38-56), `updateAllocation` (service.ts:58-75), dan `endAllocation` (service.ts:77-94). Ketiganya berhenti di throw `NotImplementedError` tanpa transaksi. Pola acuan di repo: `withTransaction` dipakai di skills.assignment.service.ts:142, lock skills memakai FOR SHARE (skills.repository.ts:114-131), dan staffing.repository.ts:93 dan :137 memakai `prisma.$transaction` langsung. ADR-009 menyebut create dan update. End dan cancel tidak disebut eksplisit. Keputusan apakah keduanya perlu lock ada di Tech Lead.

1. [Tinggi] Lock dan transaksi belum ada, seperti dijelaskan di atas. Audit docs/audits/2026-10-12-full-project-audit.md:138 (A-01) mencatat hal yang sama. Kontrak POST /allocations menyebut row lock (openapi.yaml:1289).
2. [Tinggi] Engine kapasitas tidak dipanggil, dan 409 CAPACITY_CONFLICT tidak mungkin dihasilkan. Modul tidak mengimpor capacity. Kontrak 409 ada di openapi.yaml:1313-1318 dan 1390-1395. Kelas `CapacityConflictError` sudah ada (app-error.ts:90-103), tetapi belum dipakai modul mana pun.
3. [Sedang] Komentar `withTransaction` (common/database/transaction.ts:11-20) menyatakan mutasi alokasi memakai boundary ini dan repository menerima parameter `tx` opsional. Repository allocations tidak punya parameter `tx` (repository.ts:13, 22). Komentar ini menyesatkan sampai implementasi selesai.
4. [Sedang] Cancel: kontrak mengembalikan 200 dengan body Allocation (openapi.yaml:1462-1470). Kode mengembalikan 204 (controller.ts:116, response.ts:15-17) dan service bertipe `Promise<void>` (service.ts:96). Belum tercapai karena 501. Pilih satu sebelum implementasi.
5. [Sedang] GET /allocations: kontrak mendokumentasikan query employeeId, projectId, startDate, dan endDate (openapi.yaml:1257-1269). Tidak ada skema query di allocations.schema.ts. Controller meneruskan `req.query` mentah (controller.ts:20-23), dan service mengabaikannya (service.ts:15-18). `validateQuery` tersedia (validate.ts:41-59) tetapi tidak dipakai di routes.
6. [Sedang] Kontrak 403 pada GET (openapi.yaml:1279-1280, 1350-1351) tidak dihasilkan, karena rute GET hanya `requireAuth` (routes.ts:17, 19-24). Keputusan peran baca belum dibuat (lihat Aturan bisnis).
7. [Sedang] Aturan ERD 2.8 tidak ditegakkan di database. Migration init tidak memuat CHECK untuk `allocation_percentage` 1 sampai 100 atau untuk `end_date >= start_date` (migration.sql:154-170). Penegakan hanya di Zod (schema.ts:9-13, 21-24, 39-50). Pada PATCH, urutan tanggal tidak diperiksa bila hanya satu tanggal dikirim, dan service tidak membaca baris lama untuk memeriksanya (service.ts:58-75).
8. [Rendah] Format tanggal: regex `^\d{4}-\d{2}-\d{2}$` menerima tanggal yang tidak ada di kalender, misalnya 2026-02-31 (schema.ts:16, 19, 32, 36, 55). Kontrak memakai `format: date` (openapi.yaml:1424, 2237-2238, 2245-2246). Jalur persist belum ada, jadi dampaknya belum terjadi.
9. [Sedang] Skema Allocation di kontrak (openapi.yaml:2248-2276) memuat displayStatus, employeeName, projectName, projectCode, jobRoleTitle, dan field lain. Tidak ada view mapper di modul. Repository mengembalikan record Prisma mentah (repository.ts:13-20), dan service bertipe `unknown`.
10. [Sedang] `createAllocation` hanya memeriksa proyek (service.ts:42-51). employeeId, jobRoleId, dan staffingRequirementId belum diperiksa keberadaannya. Kontrak hanya menuntut format uuid (openapi.yaml:2232-2235).
11. [Rendah] Kontrak 403 pada mutasi (openapi.yaml:1311-1312, 1386-1387, 1437-1438, 1473-1474) hanya berasal dari `requireRole` (rbac.ts:36-41). PM yang bukan pemilik proyek menerima 404 (common/auth/policy.ts:225, service.ts:47-51, 67-71, 86-90, 101-105). Pola ini sesuai non-disclosure, tetapi kontrak tidak menyebutnya.
12. [Rendah] Duplikasi policy: allocations.policy.ts:7-22 mendefinisikan `allocationsPolicy`, tetapi service memakai `assertCanManageAllocation` langsung (service.ts:2). Objek itu hanya dipakai tes (apps/api/tests/authorization.test.ts:38, 1134-1142). Pilih satu jalur.
13. [Info] Keenam operasi sudah punya 501 di kontrak (openapi.yaml:1281, 1321, 1356, 1398, 1443, 1479). Ini sesuai stub di service. Temuan ROUND-5 dan ROUND-6 tentang 501 yang belum terdokumentasi sudah tertutup.
14. [Info] Tabel allocations di ERD dan schema.prisma sesuai: kolom, FK (migration.sql:255-267), dan indeks. Tidak ada drift struktur.

## Belum diverifikasi

- TSD (§9.3, §10.3, §10.4, §10.5): dokumen TSD tidak ada di repo, dan isi bagian-bagian ini tidak dibaca. §10.5 tidak dikutip di file mana pun di repo. Klaim lock dan kapasitas di dokumen ini bersumber dari ADR-009, docs/CODING_STANDARD.md bagian 6, dan docs/CODE_REVIEW_CHECKLIST.md:75-76, bukan dari TSD langsung.
- PRD: tidak ada di repo. ID US04.01 dan US04.02 belum dicek ke PRD. Tidak ada kartu task US04 di docs/tasks/. docs/quality/traceability.md:47-48 mencatat keduanya "Belum dipetakan".
- Tes: apps/api/tests/authorization.test.ts dibaca sebagian (baris 36-41, 436-469, 488-572, 1134-1142, 1434-1465). Tes tidak dijalankan. Gate `npm run lint`, `npm run typecheck`, `npm test`, dan `npm run build` tidak dijalankan.
- Middleware sesi dan identitas (common/auth/session.ts, identity loader yang mengisi req.user), errorHandler, dan rate limiter tidak dibaca.
- Engine kapasitas (capacity.service.ts) hanya dicek signature `evaluateCapacity`. Logika sweep-line tidak diverifikasi.
- Migration hanya dibaca sebagai SQL dan tidak diuji terhadap database. Pencarian CHECK dilakukan di seluruh folder migrations.
- apps/web tidak dicek.
- docs/development/coding-conventions.md:39 dan docs/audits/ROUND-5 dan ROUND-6 hanya dibaca lewat pencarian, belum dibaca utuh.
