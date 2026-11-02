# Modul dashboard

- Status: Draft, belum Verified. Klaim tentang kode dan kontrak sudah dicek. Klaim yang bergantung pada PRD dan TSD belum bisa dicek karena keduanya tidak ada di repo, dan perilaku runtime belum dijalankan. Lihat bagian Belum diverifikasi.
- Pemilik: Backend (Saiful & Jundy)
- Story PRD: US06.01, US06.02
- Sumber: PRD (rujuk ID story), TSD (rujuk nomor bagian: §4), docs/api/openapi.yaml, docs/database/erd.md
- Kode: apps/api/src/modules/dashboard/ | Pemasangan: apps/api/src/app.ts:152-153 | Tes terkait: apps/api/tests/authorization.test.ts:1554-1568

## Tanggung jawab

- Folder ini memuat dua router GET yang dipasang di `/api/v1`: `/dashboard` (ringkasan berbasis peran) dan `/me` (tampilan diri karyawan).
- Keduanya masih stub. Setelah `requireAuth`, keduanya melempar `NotImplementedError` (501).
- Modul belum mengagregasi data, belum memeriksa peran, belum memvalidasi query, dan belum memanggil modul lain.
- Modul tidak menyentuh database. Tidak ada repository, service, atau schema di folder ini.
- Handler `/me` ada di modul ini, bukan di modul identity. Lihat Endpoint dan Drift.

## Struktur file

Folder hanya berisi satu file kode. Pola `controller.ts`, `service.ts`, `repository.ts`, `schema.ts`, `policy.ts`, dan `types.ts` dari CLAUDE.md belum ada (lihat Drift 6).

| File | Baris | Peran |
|---|---|---|
| dashboard.routes.ts | 29 | Berisi dua router. `dashboardRouter` (baris 5-16) untuk GET `/`. `meRouter` (baris 18-29) untuk GET `/`. Keduanya memakai `requireAuth()` lalu melempar 501. |
| .gitkeep | 0 | Penanda folder. |

## Endpoint

Pemasangan di `apps/api/src/app.ts`: `/api/v1/dashboard` (app.ts:152) dan `/api/v1/me` (app.ts:153). Keduanya memakai `sessionCookie`.

| Method dan path | Peran yang boleh (kode) | Kontrak OpenAPI | Kode error utama |
|---|---|---|---|
| GET `/dashboard` | Semua user terautentikasi. Tidak ada `requireRole` (dashboard.routes.ts:6). | openapi.yaml:1596-1621. Peran tidak disebut. Query `startDate` dan `endDate` (format date). Respons 200, 401, 501. | 401 UNAUTHORIZED (rbac.ts:10-21). 501 NOT_IMPLEMENTED (dashboard.routes.ts:10-12). |
| GET `/me` | Semua user terautentikasi (dashboard.routes.ts:19). | openapi.yaml:1623-1642. Peran tidak disebut. Respons 200, 401, 501. | 401 UNAUTHORIZED (rbac.ts:10-21). 501 NOT_IMPLEMENTED (dashboard.routes.ts:23-25). |

- 501 memakai `NotImplementedError` (common/errors/app-error.ts:111-115) dengan code `NOT_IMPLEMENTED`. Skema kontraknya `NotImplementedResponse` (openapi.yaml:1705-1710). error-handler.ts:15 mencatatnya sebagai warn, bukan error.
- Kontrak tidak mencantumkan 403 untuk kedua endpoint.
- Tes yang ada, tidak dijalankan: authorization.test.ts:1554-1560 mengharapkan 501 untuk GET `/dashboard` sebagai admin. authorization.test.ts:1562-1568 mengharapkan 501 untuk GET `/me` sebagai employee. Tes ini memakai Prisma dan butuh database.

**Lokasi handler /me.** Handler `/me` berada di dashboard.routes.ts:18-29. Tidak ada folder `me/`, dan modul identity tidak memuat handler ini. `GET /api/v1/auth/me` adalah endpoint lain yang sudah berjalan di identity (identity.routes.ts:26, identity.controller.ts:44-50, kontrak openapi.yaml:144-165). Traceability memetakan US06.02 ke modul dashboard (docs/quality/traceability.md:51), sehingga penempatan di folder dashboard konsisten dengan traceability. Prefix URL-nya tetap `/me`, di luar `/dashboard`.

## Entitas dan tabel

- Kode modul tidak menyentuh tabel. dashboard.routes.ts hanya mengimpor `express`, `requireAuth`, dan `NotImplementedError` (baris 1-3).
- Kontrak tidak menyebut tabel. Entitas berikut diduga akan dibaca bila endpoint diimplementasikan. Ini inferensi dari bentuk field kontrak dan belum ada di kode:
  - `employees` (status ACTIVE/INACTIVE): ERD §2.4 (erd.md:186-193). Dugaan dasar `totalActiveResources` (openapi.yaml:2360, 2368).
  - `projects` (status): ERD §2.6 (erd.md:204-211). Dugaan dasar `totalActiveProjects` dan `accessibleProjects` (openapi.yaml:2369, 2379-2382).
  - `staffing_requirements`: ERD §2.7 (erd.md:213-220). Dugaan dasar `openStaffingRequirements` (openapi.yaml:2364, 2372). Tabel ini tidak punya kolom status (erd.md:99-111, schema.prisma:158-177), jadi kata "open" belum punya definisi.
  - `allocations`: ERD §2.8 dan §3 (erd.md:222-240). Dugaan dasar `capacityDistribution`, `currentAllocations`, `plannedAllocations`, dan `currentTotalAllocation` (openapi.yaml:2373-2378, 2402-2410). ERD §3 menurunkan status ACTIVE dan PLANNED dari tanggal, dan kontrak memisahkan current dari planned dengan cara yang sejalan.
  - `users` (`employee_id`): ERD §2.1 (erd.md:162-168). Dugaan dasar untuk menemukan profil karyawan milik user yang login pada `/me`.

## Aturan bisnis dan otorisasi

Isi aturan tidak disalin. Rujukan ID dan nomor bagian saja.

- Ringkasan dashboard harus berbasis peran (openapi.yaml:1598, "Role-scoped"). Kode belum punya logika peran. Semua peran yang sudah login menerima 501 yang sama (dashboard.routes.ts:6, 8-16).
- Pembatasan peran untuk halaman web `/dashboard` hanya ada di sisi klien (apps/web/src/app/router/index.tsx:70-76, apps/web/src/app/navigation/nav-config.ts:35). CLAUDE.md menetapkan backend sebagai sumber otoritas, jadi pembatasan di backend harus ditambahkan saat implementasi.
- `/me` menampilkan data karyawan yang sedang login. Kode belum memeriksa kepemilikan data. Kontrak belum mendefinisikan aturan peran atau kepemilikan untuk `/me` (openapi.yaml:1623-1642).
- Tautan user ke karyawan wajib untuk PROJECT_MANAGER, RESOURCE_MANAGER, dan EMPLOYEE (BR-G02, dikutip di erd.md:168). Untuk ADMIN tanpa profil karyawan, `profile` pada `EmployeeSelfView` (openapi.yaml:2386-2397) wajib tetapi tidak punya sumber data. Lihat Drift 5.
- AC untuk US06.01 dan US06.02 tidak ada di repo. Lihat Belum diverifikasi.

## Dependensi

Masuk (modul lain memanggil dashboard):
- Tidak ada. Web tidak memanggil `/api/v1/dashboard` maupun `/api/v1/me`. `apps/web/src/features/dashboard/dashboard-page.tsx` tidak memanggil API. Web memanggil `/auth/me` (apps/web/src/app/providers/auth-provider.tsx:71, 84), bukan `/me`.

Keluar (dashboard memanggil modul lain):
- Tidak ada. Impor kode hanya dari `common/auth/rbac.ts` (`requireAuth`) dan `common/errors/app-error.ts` (`NotImplementedError`).

Diharapkan oleh kontrak, belum ada di kode:
- capacity: `capacityDistribution` dan `remainingCapacity`. CLAUDE.md menetapkan `CapacityService` sebagai sumber kebenaran tunggal. Engine pure function `evaluateCapacity` ada di capacity.service.ts:41 (lihat capacity.md).
- workforce, projects, allocations: data agregat. Pemanggilan harus lewat service publik masing-masing, bukan repository (CLAUDE.md, Architecture Laws). Fungsi service yang dibutuhkan belum dicek.
- identity: profil user dan tautan employee untuk `/me`. Titik publik yang ada adalah `identityService` (identity.service.ts:12). Fungsi yang sesuai belum dicek.

## Drift dan catatan

1. Status 501 vs kontrak 200 (dashboard.routes.ts:10-12, 23-25; openapi.yaml:1608-1617, 1629-1638). Ini status implementasi Sprint 1, bukan selisih desain. Pesan di kode menyebut Sprint 1.
2. Dua endpoint "siapa saya". `/api/v1/auth/me` memakai `UserIdentity` (openapi.yaml:1754). `/api/v1/me` memakai `EmployeeSelfView` (openapi.yaml:2384). Keduanya berbeda bentuk dan tujuan. Keputusan pemilik akhir untuk `/me` belum tercatat di dokumen yang dibaca (dashboard.routes.ts:18-29, app.ts:153).
3. Role-scoped tanpa logika peran. Kontrak menyebut "Role-scoped" (openapi.yaml:1598), sedangkan kode hanya `requireAuth` (dashboard.routes.ts:6). Kontrak juga tidak menyebut 403 (openapi.yaml:1618-1621), padahal `requireRole` bisa menghasilkan 403 (rbac.ts:27-45). Kontrak perlu menyatakan peran yang boleh.
4. Query tidak divalidasi. openapi.yaml:1601-1607 mendefinisikan `startDate` dan `endDate`. dashboard.routes.ts:8 tidak membaca `req.query`. Kontrak tidak menyebut perilaku saat `endDate` lebih kecil dari `startDate`. Saat diimplementasikan, perlu skema Zod (CLAUDE.md, Architecture Laws).
5. `profile` wajib untuk user tanpa employee. openapi.yaml:2386-2397 mewajibkan `profile`. erd.md:168 menyebut `users.employee_id` boleh kosong untuk ADMIN. Kontrak diam tentang `/me` untuk user tanpa `employee_id`, dan kode belum memeriksanya.
6. Struktur modul. CLAUDE.md (Architecture Laws, Boundaries) mewajibkan `controller.ts`, `service.ts`, `repository.ts`, `schema.ts`, `policy.ts`, dan `types.ts` per modul. Folder ini hanya punya `dashboard.routes.ts`. Konvensi prefiks yang sama dipakai capacity (capacity.md drift 10).
7. Definisi "open" dan ambang ketersediaan belum ada. openapi.yaml:2364 dan 2373-2378 tidak mendefinisikan batas `partiallyAvailable`, dan tabel `staffing_requirements` tidak punya status (erd.md:99-111). Enum ketersediaan di `OrganizationCapacityResponse` (openapi.yaml:2343) juga berbeda dari `Employee.availability`, seperti dicatat capacity.md drift 11.
8. Tidak ada tes khusus untuk folder ini. Satu-satunya tes yang menyentuh dashboard dan `/me` adalah authorization.test.ts:1554-1568, dan keduanya hanya memeriksa 501.

## Belum diverifikasi

- Teks PRD untuk US06.01 dan US06.02 beserta AC-nya. PRD tidak ada di repo. ID hanya berasal dari docs/quality/traceability.md:50-51.
- Isi TSD §4 (modul Dashboard). TSD tidak ada di repo. Nomor bagian diberikan oleh permintaan, dan isinya tidak dibaca.
- Perilaku runtime 401 dan 501. Dibaca dari kode, tidak dijalankan. Tes di authorization.test.ts:1554-1568 butuh database Prisma.
- Peran mana yang seharusnya boleh mengakses `/dashboard` dan `/me`. Tidak ada di kontrak atau kode.
- Kesesuaian path `/dashboard` dan `/me` di apps/web/src/api/schema.d.ts (baris 2088 dan 2131) dengan openapi.yaml belum dibandingkan isinya.
- Gate `npm run lint`, `npm run typecheck`, `npm test`, dan `npm run build` tidak dijalankan. Dokumen ini tidak mengubah kode dan tidak di-commit.
