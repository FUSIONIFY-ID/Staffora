# Modul resource-finder

- Status: Belum Verified. Klaim tentang kode dan kontrak sudah dicek. TSD dan PRD tidak ada di repo, dan tes serta gate build belum dijalankan (lihat "Belum diverifikasi").
- Pemilik: Backend (Saiful & Jundy)
- Story PRD: US03.03
- Sumber: PRD (rujuk ID story), TSD (rujuk nomor bagian: §4 dan §10), docs/api/openapi.yaml, docs/database/erd.md
- Lokasi kode: apps/api/src/modules/resource-finder/. Path di bawah relatif terhadap router apiV1 (app.ts:150). Server kontrak berada di /api/v1 (openapi.yaml:7).

## Tanggung jawab

- Mencari karyawan yang tersedia untuk rentang tanggal tertentu, dengan filter jobRoleId, departmentId, skillId, minProficiency, dan minRemainingCapacity. Kontrak: openapi.yaml:1486-1529. Ringkasan modul: docs/architecture/overview.md:62.
- Setiap hasil memuat peak alokasi bersamaan dan sisa kapasitas (openapi.yaml:2286-2313). Angka ini harus berasal dari engine kapasitas, bukan dihitung ulang di modul (lihat Dependensi).
- Modul hanya membaca. Satu-satunya rute adalah GET (routes.ts:14).
- Saat ini hanya lapisan HTTP, validasi query, dan pemeriksaan peran yang berjalan. Setelah itu service melempar NotImplementedError dan menghasilkan 501 (service.ts:5-7). Lihat Drift 1.

## Struktur file

Folder berisi empat file TypeScript dan `.gitkeep` (placeholder).

- resource-finder.routes.ts: router Express. `requireAuth` dan `requireRole` dipasang di semua rute (routes.ts:9-12). `GET /` memakai `validateQuery`, lalu `controller.search` (routes.ts:14-18).
- resource-finder.controller.ts: memanggil `resourceFinderService.search(req.query)`, membungkus hasil dengan `sendSuccess` sehingga menjadi `{ data }`, dan meneruskan error ke `next` (controller.ts:5-17).
- resource-finder.schema.ts: skema Zod untuk query. Berisi startDate dan endDate (regex YYYY-MM-DD), filter UUID opsional, minProficiency 1-5, minRemainingCapacity 0-100, dan refine endDate >= startDate (schema.ts:3-20).
- resource-finder.service.ts: stub. `search` selalu melempar `NotImplementedError` (service.ts:4-8).
- .gitkeep: placeholder.

Tidak ada repository.ts, policy.ts, atau types.ts. CLAUDE.md (bagian Boundaries) menetapkan pola file itu untuk setiap modul domain. Lihat Drift 9.

## Endpoint

Path lengkap: `GET /api/v1/resource-finder`. Kontrak: openapi.yaml:1486-1529. Peran dari routes.ts:11. Kode error dari common/errors/app-error.ts dan common/auth/rbac.ts.

| Metode | Path | Peran yang boleh | Kode error utama |
| --- | --- | --- | --- |
| GET | /resource-finder | ADMIN, PROJECT_MANAGER, RESOURCE_MANAGER (routes.ts:11). Kontrak tidak menyebut peran. EMPLOYEE ditolak oleh kode (rbac.ts:36-41). | 401 UNAUTHORIZED (rbac.ts:12, 29). 403 FORBIDDEN (rbac.ts:36-41). 422 UNPROCESSABLE_ENTITY untuk query tidak valid (validate.ts:41, app-error.ts:38). 501 NOT_IMPLEMENTED (service.ts:5-7, app-error.ts:111). |

- Respons sukses: kontrak 200 dengan ResourceFinderResponse (openapi.yaml:1516-1521). Kode belum menghasilkan 200 (Drift 1 dan 3).
- Parameter query: startDate dan endDate wajib, sisanya opsional (openapi.yaml:1492-1514). Nama dan batas angka sama dengan schema.ts:11-15. Format tanggal berbeda (Drift 4).
- Tidak ada endpoint lain di modul ini.

## Entitas dan tabel

Modul belum menyentuh tabel. Service tidak memanggil Prisma (service.ts:1-9). Entitas di bawah berasal dari kontrak dan ERD untuk pencarian ini.

- employees (erd.md §2.4): sumber employeeCode, fullName, dan workEmail (openapi.yaml:2302-2304). Kontrak dan kode tidak memfilter kolom `status`.
- departments dan job_roles (erd.md §2.3): sumber departmentName dan jobRoleTitle (openapi.yaml:2305-2306), serta filter departmentId dan jobRoleId.
- skills dan employee_skills (erd.md §2.5): filter skillId dan minProficiency terhadap `proficiency_level`. erd.md:202 mencatat indeks `(skill_id, proficiency_level, employee_id)` untuk Resource Finder. Indeks ini ada di schema.prisma:134 dan migrasi init (apps/api/prisma/migrations/20261005113838_init/migration.sql:201).
- allocations (erd.md §2.8): sumber peakConcurrentAllocation dan remainingCapacity lewat engine kapasitas. Engine mengabaikan alokasi dengan cancelled_at terisi (capacity.service.ts:55).

## Aturan bisnis dan otorisasi

Repo tidak memetakan ID AC untuk US03.03. Traceability mencatat "Belum dipetakan" (docs/quality/traceability.md:46). Teks PRD tidak ada di repo, sehingga aturan di bawah dirujuk ke ID BR yang ada di repo.

- Akses dibatasi ke ADMIN, PROJECT_MANAGER, dan RESOURCE_MANAGER (routes.ts:11). Tidak ada ID AC yang dikutip untuk aturan ini.
- Peak alokasi tidak dijumlahkan untuk alokasi berurutan (BR-G17; docs/CODING_STANDARD.md:208). Engine yang menerapkannya adalah evaluateCapacity (capacity.service.ts:41).
- Total alokasi bersamaan per karyawan tidak boleh lebih dari 100% pada tanggal mana pun (BR-G07; docs/CODING_STANDARD.md:317). Rumus sisa kapasitas di engine adalah 100 dikurangi peak, dengan batas bawah 0 (capacity.service.ts:151). Belum ada kode di modul ini yang memakai rumus itu.
- Rentang tanggal: endDate harus sama dengan atau setelah startDate (schema.ts:17-20). Aturan ini tidak punya ID BR atau AC di repo, dan kontrak tidak menyebutnya (Drift 5).
- Format tanggal: YYYY-MM-DD (schema.ts:5-10). Kontrak menyebut format date (openapi.yaml:1495, 1499). Validasi kalender belum ada (Drift 4).

## Dependensi

- Modul lain yang dipanggil saat ini: tidak ada. service.ts hanya mengimpor NotImplementedError (service.ts:1).
- Utilitas bersama yang dipakai: requireAuth dan requireRole (common/auth/rbac.ts), validateQuery (common/validation/validate.ts:41), sendSuccess (common/http/response.ts), dan NotImplementedError (common/errors/app-error.ts:111).
- Yang dibutuhkan kontrak: peak dan sisa kapasitas per karyawan. Layanan publik yang tersedia adalah fungsi ekspor `evaluateCapacity` di modules/capacity/capacity.service.ts:41, dengan hasil peakAllocation dan remainingCapacity (capacity.types.ts:9-11). Modul workforce memakai fungsi ini dengan cara yang sama (workforce.views.ts:1-4, 54-57, 132-135). Resource-finder belum memanggilnya.
- Akses data: belum ada repository.ts. CLAUDE.md menetapkan bahwa Prisma hanya diakses lewat repository, dan modul saling berkomunikasi lewat service publik, bukan repository modul lain.
- Konsumen web: tidak ada. Hanya tipe hasil generate di apps/web/src/api/schema.d.ts yang merujuk endpoint ini (path di baris 1949; skema ResourceFinderItem dan ResourceFinderResponse di baris 2549 dan 2562). File itu dibuat dari docs/api/openapi.yaml lewat `npm run api:types` (package.json:25).

## Drift dan catatan

Selisih antara kode, kontrak, dan CLAUDE.md. Kecuali disebut lain, berkas berada di apps/api/src/modules/resource-finder/.

1. Implementasi belum ada, ini bukan selisih desain. Kontrak menjanjikan 200 (openapi.yaml:1516-1521), tetapi service.ts:5-7 melempar 501. Tes `apps/api/tests/authorization.test.ts:1586-1592` mengunci 501. Tes itu harus diubah bersama implementasi.
2. Pesan stub menyebut Sprint 1 (service.ts:6). Kontrak mencatat soft-delete dan arsip untuk Sprint 2 (US03) (openapi.yaml:1229). Sprint untuk US03.03 tidak bisa dipastikan dari repo, karena PRD tidak ada.
3. Tipe return tidak sesuai kontrak. `search` mengembalikan `Promise<unknown[]>` (service.ts:4), sedangkan kontrak memakai objek `{ data, meta }` (openapi.yaml:2315). `meta` berisi startDate, endDate, dan totalResults. `sendSuccess` hanya menghasilkan `{ data }` (controller.ts:13). `sendList` di common/http/response.ts menghasilkan meta dengan page, pageSize, dan total, yang tidak cocok dengan kontrak.
4. Format tanggal hanya dicek bentuknya. Regex di schema.ts:7 dan schema.ts:10 menerima tanggal yang tidak ada, misalnya 2026-02-31 atau 2026-13-01. Kontrak memakai format date (openapi.yaml:1495, 1499).
5. Aturan endDate >= startDate ada di kode (schema.ts:17-20), tetapi tidak ada di kontrak (openapi.yaml:1496-1499). Refine juga tidak berjalan bila salah satu tanggal gagal regex. Perilaku ini belum diuji.
6. Peran tidak disebut kontrak. openapi.yaml:1486-1529 tidak menyebut peran, sedangkan routes.ts:11 membatasi ke tiga peran. Tidak ada tes 403 untuk EMPLOYEE pada rute ini. Pencarian tes hanya menemukan tes 501 (authorization.test.ts:1586-1592).
7. Deskripsi availabilityStatus (openapi.yaml:2346-2354) menyebut resource-finder view. Properti itu hanya ada di OrganizationCapacityResponse (openapi.yaml:2329-2345). ResourceFinderItem (openapi.yaml:2286-2313) tidak memilikinya dan memakai isAssignable (openapi.yaml:2309). Aturan isAssignable tidak ada di ERD atau kode.
8. Nama field tidak sama dengan engine. Engine memakai peakAllocation (capacity.types.ts:10), kontrak memakai peakConcurrentAllocation (openapi.yaml:2307). Pemetaan perlu dibuat saat implementasi.
9. Struktur modul belum lengkap. repository.ts, policy.ts, dan types.ts tidak ada (CLAUDE.md, bagian Boundaries).
10. CLAUDE.md menyebut `CapacityService` sebagai sumber tunggal perhitungan kapasitas. File capacity.service.ts tidak punya kelas bernama demikian. Yang diekspor adalah fungsi (capacity.service.ts:7, 14, 23, 41, 164).
11. minProficiency tanpa skillId diterima kode (schema.ts:14), tetapi kontrak tidak menjelaskan hubungan kedua filter (openapi.yaml:1506-1511). Arti filter jobRoleId dan departmentId terhadap hasil juga belum didefinisikan di kontrak.
12. Paginasi dan batas jumlah hasil tidak ada di kontrak maupun kode (openapi.yaml:1486-1529, schema.ts).

## Belum diverifikasi

- TSD §4 dan §10: dokumen TSD tidak ada di repo. Nomor bagian berasal dari permintaan, dan isi bagian tidak dibaca.
- PRD US03.03: teks dan ID AC tidak ada di repo. Tidak ada AC yang dikutip.
- Tes: tes belum dijalankan. Gate `npm run lint`, `npm run typecheck`, `npm test`, dan `npm run build` belum dijalankan.
- Middleware sesi dan identitas (common/auth/session.ts, common/auth/identity-loader.ts) tidak dibaca. Klaim 401 bergantung pada req.user yang diisi di sana.
- Perilaku Zod pada input tidak biasa, misalnya minProficiency kosong atau UUID dengan format tidak standar, belum diuji.
- Error handler (common/errors/error-handler.ts) dibaca, tetapi belum dijalankan.
- Logika evaluateCapacity tidak diverifikasi untuk kasus resource-finder.
- apps/web hanya dicek lewat pencarian. Belum dicek apakah schema.d.ts sama dengan hasil `npm run api:types` terbaru.
- Pencarian tes memakai string `resource-finder`. Tes yang membangun path dari variabel tidak terdeteksi, jadi tidak ada tes lain yang bisa dipastikan tidak ada.
- Tidak ada tes yang membuktikan perilaku endpoint selain 501.
