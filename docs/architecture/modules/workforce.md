# Modul workforce

- Status: Belum Verified. Klaim tentang kode dan kontrak sudah dicek. TSD dan PRD tidak ada di repo, dan tes belum dijalankan (lihat "Belum diverifikasi").
- Pemilik: Backend (Saiful & Jundy)
- Story PRD: US02.01
- Sumber: PRD (rujuk ID story, jangan salin teks), TSD (rujuk nomor bagian: 9.1, 9.2 sebagai konteks; 10.3 dan 10.4 untuk kapasitas dan lock), docs/api/openapi.yaml, docs/database/erd.md
- Lokasi kode: apps/api/src/modules/workforce/
- Path di bawah relatif terhadap router `apiV1` (apps/api/src/app.ts:133-135).

## Tanggung jawab

- Master data departemen dan job role: daftar yang aktif dan pembuatan oleh ADMIN. Tidak ada endpoint ubah, hapus, atau nonaktifkan.
- Direktori karyawan: daftar dengan paginasi dan filter (search, departmentId, jobRoleId, status), pembuatan profil, detail, dan pembaruan parsial (fullName, departmentId, jobRoleId, status).
- Ketersediaan karyawan saat ini dihitung dengan memanggil engine kapasitas. Modul ini tidak menjumlahkan persentase alokasi sendiri (workforce.views.ts:50-58).
- Detail karyawan memuat skill, alokasi, dan evaluasi kapasitas untuk rentang tanggal.
- Kontrol akses profil memakai pola non-disclosure: karyawan yang meminta profil orang lain mendapat 404.
- Di luar modul ini: endpoint skill (/skills, /employees/{id}/skills), alokasi (/allocations), proyek, dan capacity. Path itu ada di kontrak, tetapi tidak didaftarkan di routes workforce.

## Struktur file

Folder berisi 10 file TypeScript dan `.gitkeep` (0 byte, placeholder).

- workforce.routes.ts: tiga router (departmentsRouter, jobRolesRouter, employeesRouter). Setiap rute memakai requireAuth, requireRole, lalu validateBody atau validateParams.
- workforce.controller.ts: membaca request, memanggil service, dan memberi bentuk respons (sendSuccess, sendCreated, sendList).
- workforce.service.ts: use case. Memeriksa duplikat dan referensi, memetakan P2002 ke 409, dan memeriksa akses detail.
- workforce.repository.ts: satu-satunya akses Prisma di modul. Berisi include untuk ringkasan dan detail.
- workforce.schema.ts: skema Zod untuk body, path, dan query. Juga normalisasi nama.
- workforce.query.ts: parser query manual (workaround sementara, lihat Drift).
- workforce.policy.ts: helper otorisasi. canViewEmployee dan assertCanViewEmployee dipakai, canManageEmployee tidak dipakai.
- workforce.views.ts: memetakan record ke view dan menghitung availability lewat engine kapasitas.
- workforce.types.ts: tipe record dan view (EmployeeView, EmployeeDetail).
- workforce.errors.ts: kode error duplikat (DUPLICATE_*) dan peta nama index unik ke kode error.

## Endpoint

Sumber peran: workforce.routes.ts. Sumber kode error: kontrak dan handler. Validasi gagal memakai `code` "UNPROCESSABLE_ENTITY" (app-error.ts, ValidationError), bukan kode spesifik.

| Metode | Path | Peran yang boleh | Kode error utama |
| --- | --- | --- | --- |
| GET | /departments | Semua peran terautentikasi (routes:19) | 401 |
| POST | /departments | ADMIN (routes:22) | 401, 403, 409 DUPLICATE_DEPARTMENT_NAME, 422 |
| GET | /job-roles | Semua peran terautentikasi (routes:30) | 401 |
| POST | /job-roles | ADMIN (routes:33) | 401, 403, 409 DUPLICATE_JOB_ROLE_NAME, 422 |
| GET | /employees | ADMIN, PROJECT_MANAGER, RESOURCE_MANAGER (routes:43) | 401, 403, 422 (query tidak valid) |
| POST | /employees | ADMIN, RESOURCE_MANAGER (routes:48) | 401, 403, 409 DUPLICATE_EMPLOYEE_CODE, DUPLICATE_WORK_EMAIL, DUPLICATE_RESOURCE (hanya kode), 422 |
| GET | /employees/{id} | ADMIN, PROJECT_MANAGER, RESOURCE_MANAGER, EMPLOYEE (routes:54). EMPLOYEE hanya untuk profil sendiri. | 401, 404, 422 (id atau rentang tanggal) |
| PATCH | /employees/{id} | ADMIN, RESOURCE_MANAGER (routes:60) | 401, 403, 404, 422 |

Catatan endpoint:
- Kontrak untuk POST dan PATCH menyebut CSRF. Penegakan CSRF di middleware tidak dibaca di dokumen ini.
- 501 untuk GET /departments dan GET /job-roles ada di kontrak, tetapi kode tidak mengembalikannya (lihat Drift).
- 409 untuk PATCH dan 403 untuk GET /employees/{id} ada di kontrak, tetapi kode tidak menghasilkannya di jalur itu (lihat Drift).

## Entitas dan tabel

Sumber: docs/database/erd.md dan migration di apps/api/prisma/migrations/.

- departments (ERD 2.3): dibaca dan ditulis (create). Kolom yang disentuh: name, is_active, created_by, updated_by. Unik pada name (departments_name_key) dan pada lower(name) (departments_name_lower_key, migration 20261014160000_workforce_normalized_name_uniqueness).
- job_roles (ERD 2.3): sama seperti departments. Indeks job_roles_name_key dan job_roles_name_lower_key.
- employees (ERD 2.4): dibaca dan ditulis (create dan update). Kolom yang disentuh: employee_code, full_name, work_email, department_id, job_role_id, status, created_by, updated_by. Unik pada employee_code (employees_employee_code_key) dan work_email (employees_work_email_key), dari migration 20261005113838_init.
- employee_skills dan skills (ERD 2.5): dibaca saja, pada detail. Modul membaca nama dan is_active skill. Tidak ada tulis.
- allocations (ERD 2.8): dibaca saja. Ringkasan hanya memuat alokasi yang tidak dibatalkan. Detail memuat semua alokasi, termasuk yang dibatalkan.
- projects (ERD 2.6): dibaca saja. Modul membaca project_code dan name lewat relasi alokasi pada detail.
- users: tidak diakses langsung. ID aktor dari req.user dicatat di kolom created_by dan updated_by (ERD 2.x, bertipe varchar).

## Aturan bisnis dan otorisasi

Rujuk ID. Teks tidak disalin. ID AC di bawah diambil dari komentar kode, bukan dari PRD (lihat Belum diverifikasi).

- Nama department dan job role unik setelah trim dan normalisasi spasi, dengan perbandingan tidak case-sensitive (ERD 2.3). Pemeriksaan pra-insert di service hanya mempercepat jawaban. Constraint database yang menjamin keunikan (workforce.service.ts:73-115, workforce.schema.ts:13).
- Kode karyawan dan work email unik (ERD 2.4). Work email disimpan dan dicari dalam huruf kecil (workforce.service.ts:162).
- Status karyawan wajib diisi saat create. Schema tidak memberi default (workforce.schema.ts:36-37). Acuan: US02.01 AC02.02 menurut komentar kode.
- Ketersediaan saat ini memakai puncak alokasi bersamaan pada hari ini (UTC). Alokasi yang dibatalkan tidak dihitung. Acuan: US02.01 AC01.03 (workforce.service.ts:149-150, workforce.views.ts:80-81).
- Status INACTIVE dipetakan ke NOT_ASSIGNABLE. Status ACTIVE dipetakan ke AVAILABLE, PARTIAL, atau FULLY_ALLOCATED menurut sisa kapasitas (workforce.views.ts:66-76). Acuan: US05.01 AC03.04 dan AC03.01 sampai AC03.03.
- Puncak alokasi tidak dijumlahkan. Jumlah yang tumpang tindih hanya dihitung oleh engine kapasitas (workforce.views.ts:50-58). Acuan: TSD 10.3 dan BR-G17.
- Detail: rentang evaluasi default hari ini (UTC). endDate tidak boleh sebelum startDate (workforce.schema.ts:80). Acuan: US02.01 AC04.04.
- Alokasi yang dibatalkan dikecualikan dari daftar (workforce.repository.ts:18), tetapi tampil di detail dengan displayStatus CANCELLED.
- Otorisasi detail: ADMIN, PROJECT_MANAGER, dan RESOURCE_MANAGER melihat semua profil. EMPLOYEE hanya melihat profil dengan employeeId yang sama. Selain itu, 404 (workforce.policy.ts, common/auth/policy.ts:canAccessEmployeeProfile).
- Otorisasi tulis: create dan update dibatasi di routes (requireRole). Service tidak memeriksa peran lagi.
- Referensi departmentId dan jobRoleId harus ada (assertReferencesExist, workforce.service.ts:39-58). Pemeriksaan tidak memfilter is_active.
- Konkurensi: create dan update tidak memakai transaksi atau SELECT ... FOR UPDATE. Aturan lock TSD 10.4 dan ADR-009 berlaku untuk mutasi alokasi, yang tidak ditulis modul ini.

## Dependensi

- capacity (apps/api/src/modules/capacity/capacity.service.ts): mengimpor fungsi evaluateCapacity dan toDateString. Dipakai di workforce.views.ts dan workforce.service.ts:63, 212, serta workforce.schema.ts:88. File itu mengekspor fungsi, bukan objek CapacityService. CLAUDE.md menyebut CapacityService sebagai sumber tunggal, jadi pemanggilan fungsi langsung perlu dicek oleh Tech Lead.
- common/auth: requireAuth dan requireRole (rbac.ts). canAccessEmployeeProfile dan assertCanAccessEmployeeProfile (policy.ts, diteruskan lewat rbac.ts).
- common/errors: ConflictError, ValidationError, NotFoundError (app-error.ts), mapUniqueViolation dan conflictError (unique-violation.ts), dan errorHandler (error-handler.ts) untuk format respons.
- common/validation/validate.ts: validateBody dan validateParams. validateQuery tidak dipakai modul ini.
- common/http: sendSuccess, sendCreated, sendList (response.ts), getParam (params.ts).
- common/database/prisma.ts: hanya lewat workforce.repository.ts.
- Modul lain: tidak ada pemanggilan service modul lain. Modul ini membaca tabel projects dan allocations langsung lewat include Prisma di workforce.repository.ts. Ini tidak melanggar aturan repository, tetapi data proyek dan alokasi tidak lewat service publik modul projects atau allocations.
- Auth session: req.user diisi middleware di luar modul. Tidak dibaca di dokumen ini.

## Drift dan catatan

Kode dianggap benar kecuali disebut lain. Setiap item perlu keputusan atau pembaruan kontrak.

1. 501 di kontrak untuk GET /departments (openapi.yaml:294) dan GET /job-roles (openapi.yaml:356). Handler mengembalikan 200 (workforce.routes.ts:19 dan :30). Kontrak tampak belum diperbarui.
2. Default status di kontrak. CreateEmployeeInput memberi default ACTIVE (openapi.yaml:1952). Schema menolak body tanpa status dengan 422 (workforce.schema.ts:36-37, komentar di baris 36 menyatakan tidak ada default).
3. 409 pada PATCH /employees/{id} di kontrak (openapi.yaml:592-593). UpdateEmployeeInput (workforce.schema.ts:40-50) tidak memuat field unik. updateEmployee (workforce.service.ts:215-233) tidak memetakan P2002. Jalur 409 tidak ada di kode ini. Kesalahan unik yang tak terduga akan jatuh ke 500 di errorHandler.
4. DUPLICATE_RESOURCE (workforce.errors.ts:41) dipakai sebagai fallback saat index unik tidak dikenali (workforce.service.ts:190). Kode ini tidak ada di openapi.yaml, dan kontrak POST /employees hanya menyebut DUPLICATE_EMPLOYEE_CODE dan DUPLICATE_WORK_EMAIL. Tes mengakui fallback ini di apps/api/tests/workforce.test.ts:334.
5. Batas pageSize: kode membatasi 1 sampai 100 (workforce.schema.ts:57). Kontrak GET /employees tidak mencantumkan batas maksimum (openapi.yaml:424). Urutan hasil (fullName asc, workforce.repository.ts:156) dan pencarian yang di-trim (workforce.service.ts:128) juga tidak tercantum di kontrak.
6. Email dalam huruf kecil (workforce.service.ts:162) dan pemeriksaan is_active yang tidak ada pada departmentId dan jobRoleId (workforce.repository.ts:69, :88) tidak dinyatakan kontrak. Keduanya adalah perilaku yang perlu diputuskan.
7. Komentar usang. workforce.controller.ts:30-31 dan workforce.query.ts:42-50 menyatakan validateQuery tidak bisa dipakai karena meng-assign req.query. Kode validate.ts:41-57 sudah memakai Object.defineProperty, dan projects.routes.ts:22 serta resource-finder.routes.ts:16 memakai validateQuery. Parser manual di workforce.query.ts masih dipakai dari controller. Status PR #6 yang disebut di komentar tidak diverifikasi.
8. canManageEmployee (workforce.policy.ts:23) tidak dipanggil di mana pun. Ini kode mati menurut CLAUDE.md.
9. 403 untuk GET /employees/{id} ada di kontrak. Karyawan yang meminta profil orang lain mendapat 404 (workforce.service.ts:210). Perilaku 404 sesuai deskripsi kontrak, tetapi 403 tidak dihasilkan jalur ini.
10. Field opsional Allocation di kontrak (employeeName, staffingRequirementId, openapi.yaml:2248) tidak diisi di workforce.views.ts:140-152. Field wajib terpenuhi.
11. Ukuran file. workforce.service.ts 239 baris, dekat ambang pemecahan 250 (CLAUDE.md). File lain di bawah 200 baris.
12. workforce.types.ts:31 menunjuk docs/api/contract-changelog.md. File itu ada, tetapi isinya tidak dibaca di dokumen ini.

## Belum diverifikasi

- TSD 9.1 dan 9.2: dokumen TSD tidak ada di repo. docs/README.md:10 hanya menyebut namanya. Isi bagian tidak dibaca.
- PRD: tidak ada di repo. ID AC (AC01.03, AC02.02, AC04.04, US05.01 AC03.x) diambil dari komentar kode dan kontrak, belum dicek ke PRD.
- Tes: apps/api/tests/workforce.test.ts tidak dijalankan dan hanya dibaca di satu baris. Gate npm run lint, typecheck, test, dan build tidak dijalankan.
- Perilaku P2002 dan nama index: dicocokkan dengan migration dan komentar unique-violation.ts. Tidak diuji terhadap database.
- Engine kapasitas: hanya signature dan pemanggilannya yang dibaca. Logika sweep-line di capacity.service.ts tidak diverifikasi.
- Middleware sesi, CSRF, dan request-id (common/auth/session.ts, csrf.ts, request-id.ts) tidak dibaca.
- Base path /api/v1: prefix tidak dicek di app.ts.
- Modul allocations, projects, dan skills tidak dibaca. Hanya dampaknya ke workforce yang diamati.
- ERD 2.4 (indeks status, department_id, job_role_id) dan docs/database/schema.dbml tidak dicek.
- docs/api/contract-changelog.md tidak dibaca. Status persetujuan field kontrak tidak dicek.
- apps/web tidak dicek.
