# Modul capacity

- Status: Draft, belum Verified. Teks PRD dan TSD tidak ada di repo, jadi klaim yang bergantung pada isinya hanya dirujuk lewat ID atau nomor bagian. Lihat bagian Belum diverifikasi.
- Pemilik: Backend (Saiful & Jundy)
- Story PRD: US05.01
- Sumber: PRD (rujuk ID story), TSD (rujuk nomor bagian), docs/api/openapi.yaml, docs/database/erd.md
- Kode: apps/api/src/modules/capacity/ | Tes: apps/api/tests/capacity.test.ts

## Tanggung jawab

- Menghitung kapasitas karyawan dengan sweep-line deterministik (`evaluateCapacity`, capacity.service.ts:41). Hasilnya berupa peak concurrent allocation dan sisa kapasitas pada rentang tanggal inklusif. Allocation yang dibatalkan diabaikan.
- Menyusun detail konflik (`buildCapacityConflictDetail`, capacity.service.ts:164) dengan bentuk meta yang sama dengan `CapacityConflictResponse` (openapi.yaml:1726-1750).
- Helper tanggal: `toDateString`, `addDays`, `checkDateOverlap`.
- Engine tidak mengakses database. Input berupa `AllocationInterval` in-memory (capacity.types.ts:1-7).
- Dua route `/capacity` sudah terdaftar, tetapi keduanya masih melempar `NotImplementedError` (501). Query kapasitas organisasi dan timeline per karyawan belum ada.
- Pemanggil saat ini hanya modul workforce (view baca). Jalur tulis allocations belum memanggil engine (lihat Drift).

## Struktur file

| File | Baris | Peran |
|---|---|---|
| capacity.routes.ts | 39 | Router `capacityRouter`. `requireAuth` untuk seluruh router. GET `/` dengan `requireRole`, GET `/employees/:id` dengan `validateParams`. Keduanya 501. |
| capacity.service.ts | 178 | Engine sweep-line (`evaluateCapacity`), builder detail konflik, helper tanggal. Tanpa I/O. |
| capacity.types.ts | 31 | `AllocationInterval`, `CapacityEvaluationResult`, `CapacityConflictDetail`. |
| .gitkeep | - | Penanda folder. Tidak berisi kode. |

Tidak ada `controller.ts`, `repository.ts`, `schema.ts`, atau `policy.ts` (lihat Drift).

## Endpoint

Prefix `/api/v1/capacity` (app.ts:151). Autentikasi memakai sessionCookie.

| Method dan path | Peran yang boleh (kode) | Kontrak OpenAPI | Kode error utama |
|---|---|---|---|
| GET `/capacity` | ADMIN, RESOURCE_MANAGER, PROJECT_MANAGER (capacity.routes.ts:15). EMPLOYEE mendapat 403. | openapi.yaml:1531. Peran tidak disebut. Query `startDate` dan `endDate` wajib. Respons 200, 401, 403, 501. | 401 UNAUTHORIZED, 403 FORBIDDEN, 501 NOT_IMPLEMENTED |
| GET `/capacity/employees/{id}` | Semua user terautentikasi (capacity.routes.ts:27-29). Tidak ada requireRole dan tidak ada cek kepemilikan. | openapi.yaml:1562. Peran tidak disebut. Respons 200, 401, 403, 422, 501. | 401 UNAUTHORIZED, 422 UNPROCESSABLE_ENTITY (id bukan UUID), 501 NOT_IMPLEMENTED |

- 422 diproduksi oleh `validateParams` (common/validation/validate.ts:61-71) lewat `ValidationError` (common/errors/app-error.ts:38-50), dengan code `UNPROCESSABLE_ENTITY`.
- 501 diproduksi oleh `NotImplementedError` (app-error.ts:111-115), dengan code `NOT_IMPLEMENTED`.
- Code `CAPACITY_CONFLICT` didefinisikan di app-error.ts:90-102, tetapi tidak dipakai modul mana pun.
- Tes yang ada: authorization.test.ts:1570-1585 mengharapkan 501 untuk admin pada kedua path, dan authorization.test.ts:1594-1606 mengharapkan 422 untuk id tidak valid.

## Entitas dan tabel

Modul ini tidak membaca atau menulis tabel. Entitas yang dihitung engine:

- `allocations` (docs/database/erd.md:124-139, dan §2.8 pada baris 222-231). Kolom yang masuk ke `AllocationInterval`: `allocation_percentage`, `start_date` dan `end_date` (inklusif), `cancelled_at`. Pemanggil yang menyeleksi `employee_id`.
- Model Prisma `Allocation` (apps/api/prisma/schema.prisma:195-219) sesuai dengan kolom ERD. Indeks `(employee_id, start_date, end_date)` sesuai §2.8.
- Batas 1 sampai 100 pada `allocation_percentage` (ERD §2.8) tidak punya CHECK di migrasi (apps/api/prisma/migrations, kolom di migration.sql:160). Engine tidak memvalidasinya (lihat Drift).

## Aturan bisnis dan otorisasi

Isi aturan tidak disalin. Rujukan ID dan nomor bagian saja.

- Peak, bukan jumlah. Allocation yang tidak saling overlap tidak dijumlahkan. Rujukan: BR-G17, TSD 10.3. Kode: capacity.service.ts:120-148. Tes: Scenario 5.
- Tanggal inklusif. Allocation berhenti efektif pada hari setelah `endDate` (capacity.service.ts:91-93). Tes: Scenario 6 (batas satu hari).
- Allocation yang dibatalkan tidak dihitung (capacity.service.ts:55). Tes: Scenario 11.
- Saat edit, allocation yang sedang diubah dikeluarkan lewat `excludeAllocationId` (capacity.service.ts:57-60). Tes: Scenario 10.
- Sisa kapasitas = max(0, 100 - peak) (capacity.service.ts:151).
- Konflik terjadi jika total serentak + `requestedPercentage` > 100 pada hari dalam rentang (capacity.service.ts:136-137). Tepat 100 bukan konflik. Tes: Scenario 7.
- Rujukan AC indikator ketersediaan (PRD US05.01 AC03 dan AC03.04) ada di komentar workforce.views.ts:60-65, bukan di modul ini.
- Otorisasi: hanya GET `/capacity` yang punya pembatasan peran. Belum ada policy untuk akses per karyawan (lihat Drift).
- "Hari ini" dihitung dengan tanggal UTC (capacity.service.ts:11, dipanggil dari workforce.service.ts:63 dan :212).

Skenario wajib TSD §15.3 (tests/capacity.test.ts, label "TSD 15.3"):

- Ada 15 kasus `it`. Dijalankan pada 2026-11-01 dengan `npx vitest run tests/capacity.test.ts` di apps/api: 15 dari 15 lulus.
- 13 kasus memanggil `evaluateCapacity` (Scenario 1-12 dan 15). Scenario 8 juga memanggil `buildCapacityConflictDetail`.
- Scenario 13 (tests:283-287) dan 14 (tests:290-316) tidak memanggil kode produksi. Keduanya menguji logika yang ditulis di dalam tes.
- Scenario 15 (tests:319-345) memanggil fungsi murni dua kali. Tidak menguji row lock atau transaksi.

## Dependensi

Masuk (modul lain memanggil capacity):

- workforce memanggil `evaluateCapacity` (workforce.views.ts:54 dan :132) dan `toDateString` (workforce.service.ts:16, workforce.schema.ts:2). Tipe diimpor dari capacity.types.ts (workforce.views.ts:5-8).
- allocations, dashboard, dan resource-finder tidak memanggil engine (hasil pencarian `capacity` di apps/api/src).

Keluar (capacity memanggil modul lain):

- Tidak ada. Hanya tipe lokal.
- Middleware: common/auth/rbac.ts (`requireAuth`, `requireRole`), common/validation/validate.ts (`validateParams`, `uuidParamSchema`), common/errors/app-error.ts (`NotImplementedError`).

Antarmuka publik: tidak ada file index atau interface khusus. Workforce mengimpor langsung dari `capacity.service.ts`. Pemanggilan ini memakai fungsi murni, bukan repository. Aturan repository di CLAUDE.md tidak dilanggar, tetapi CLAUDE.md meminta service publik.

## Drift dan catatan

1. 403 di kontrak belum bisa dihasilkan kode. openapi.yaml:1562 mencantumkan 403 untuk `/capacity/employees/{id}`. capacity.routes.ts:27-29 tidak punya requireRole atau cek kepemilikan, sehingga EMPLOYEE mendapat 501.
2. Peran tidak ada di kontrak. capacity.routes.ts:15 mengunci ADMIN, RESOURCE_MANAGER, PROJECT_MANAGER. openapi.yaml:1531 tidak menyebut peran. Perlu konfirmasi ke PRD US05.01 (belum dicek).
3. Query tidak divalidasi. openapi.yaml:1531-1545 mewajibkan `startDate` dan `endDate`. capacity.routes.ts:13-25 belum punya skema query. Saat diimplementasikan perlu skema Zod.
4. Rentang konflik terpotong. capacity.service.ts:139-141 memotong `firstConflictRange.endDate` di batas perubahan level berikutnya, bukan di hari terakhir total masih di atas 100. Dicek dengan skrip scratch (tidak disimpan di repo): allocation 60% (1-20 Nov), 50% (10-25 Nov), 5% (15-17 Nov), request 0%. Hasil: konflik 10-14 Nov, peak 115. Total masih di atas 100 sampai 20 Nov. Scenario 8 hanya satu segmen, sehingga tidak menangkap ini. Belum diverifikasi terhadap TSD 10.5.
5. Engine tanpa validasi input. capacity.service.ts:41-51 tidak memeriksa `allocationPercentage` 1-100, `requestedPercentage`, atau `startDate` <= `endDate`. Validasi hanya di allocations.schema.ts:13 (create) dan :29 (update). Engine mempercayai pemanggil.
6. Jalur tulis belum memakai engine. allocations.service.ts:53, :72, :91, dan :106 masih melempar `NotImplementedError`. Tidak ada impor dari modul capacity di modul allocations. Tidak ada query `FOR UPDATE` di apps/api/src; string itu hanya muncul di komentar. Kontrak POST `/allocations` menyatakan validasi kapasitas di bawah row lock (openapi.yaml:1289). CLAUDE.md dan komentar common/database/transaction.ts:16-18 mengutip TSD 10.4 untuk lock ini. Komentar transaction.ts juga mengutip ADR-009. Ini celah utama pada aturan 100%.
7. Error konflik belum diproduksi. `CapacityConflictError` (app-error.ts:90-102) dan `buildCapacityConflictDetail` (capacity.service.ts:164) hanya dipakai di definisi dan tes. Bentuk meta sudah sesuai kontrak (openapi.yaml:1726-1750).
8. Field tidak terpakai. `dailyTimeline` (capacity.types.ts:18-22) tidak diisi engine dan tidak dibaca di mana pun.
9. Zona waktu tanggal. capacity.service.ts:11 memakai `toISOString()` (UTC). workforce.service.ts:63 dan :212 memanggil `toDateString(new Date())`. workforce.schema.ts:77-78 menyatakan "hari ini" adalah tanggal UTC. ERD §3 memakai CURRENT_DATE tanpa zona waktu. Zona waktu server dan DB belum dicek. Risiko salah hari dekat tengah malam.
10. Struktur modul. Tidak ada controller, repository, schema, atau policy. Nama file memakai prefiks `capacity.*`, berbeda dari pola `routes.ts` dan `service.ts` di CLAUDE.md. Modul allocations juga memakai prefiks, jadi ini konvensi repo.
11. Penamaan. Engine memakai `peakAllocation`, kontrak organisasi memakai `peakConcurrentAllocation` (openapi.yaml:2329-2341). Pemetaannya di workforce.views.ts:159. Enum availability di OrganizationCapacityResponse (openapi.yaml:2343) berbeda dari Employee.availability. Kontrak sendiri mencatat ini di deskripsinya.
12. Kontrak belum rinci. `timeline` pada `/capacity/employees/{id}` hanya `type: object` (openapi.yaml:1562-1595).
13. Pelacakan. docs/quality/traceability.md:49 mencatat US05.01 untuk modul capacity sebagai "Belum dipetakan". Dokumen ini tidak mengubah status itu.

## Belum diverifikasi

- Teks PRD untuk US05.01 dan AC di bawahnya. Tidak ada file PRD di repo. Hanya ID yang dikutip dari kode dan traceability.
- Teks TSD 10.1-10.5 dan 15.3. Tidak ada file TSD di repo. Nomor bagian hanya berasal dari komentar kode (capacity.service.ts:39 dan :162, common/database/transaction.ts:17-19) dan judul tes.
- BR-G17. Hanya dikutip di openapi.yaml:1988 dan komentar kode. Definisinya tidak ada di repo.
- Perilaku HTTP 501, 403, dan 422. Dibaca dari kode dan authorization.test.ts:1570-1606. Tidak dijalankan karena butuh database.
- Zona waktu server dan database.
- Isi ADR-009 dan ADR-010 (hanya file-nya yang ada).
- Konsumsi frontend di apps/web/src/features/capacity/capacity-page.tsx.
- Gate `npm run lint`, `npm run typecheck`, `npm test` penuh, dan `npm run build`. Hanya capacity.test.ts yang dijalankan. Dokumen ini tidak mengubah kode dan tidak di-commit.
