# ADR-013: Penghapusan penugasan skill karyawan

- **Status**: Proposed
- **Decision Date**: —
- **Technical Decision ID**: belum ditetapkan (usulan)
- **Sumber**: TSD §9.3 (dikutip di `docs/tasks/sprint-1/US02.02.md:3` dan `:23`) dan TSD §12.1 (dikutip di `docs/database/indexes.md:65`); teks TSD tidak ada di repo. PRD US02.02 BR03 dan AC02.01 (ID dari `docs/tasks/sprint-1/US02.02.md:3`); teks PRD tidak ada di repo.

## Context

Endpoint `DELETE /employees/{id}/skills/{skillId}` menghapus baris penugasan secara fisik dan menjawab 204.

- Kontrak: `docs/api/openapi.yaml:949-980`. Deskripsi menyatakan bahwa skill tidak pernah dihapus dan menyarankan `PATCH /skills/{id}` untuk menonaktifkan skill (`:951-955`). Kontrak memakai kata "Remove" (`:950`) dan tidak menyebut arsip penugasan.
- Route: `apps/api/src/modules/skills/skills.routes.ts:70`.
- Service: `apps/api/src/modules/skills/skills.assignment.service.ts:224-246`. Pra-cek dengan `findEmployeeSkill`, lalu `deleteEmployeeSkill`.
- Repository: `apps/api/src/modules/skills/skills.employee.repository.ts:124-139`. Hard delete ada di baris 129 (`prisma.employeeSkill.delete`). Bila baris sudah hilang karena request lain, repository mengembalikan `false` dan request dijawab 404 (`:120-122`, catatan F5 di kode).
- Komentar kode di `skills.employee.repository.ts:115-118` menjelaskan bahwa baris `skills` tidak dihapus agar riwayat lain tetap utuh (BR03). Komentar itu menyatakan bahwa hanya baris penugasan yang dihapus, tetapi tidak membahas apakah baris penugasan perlu dipertahankan sebagai riwayat.

Skema dan relasi:

- `apps/api/prisma/schema.prisma:121-136` tidak punya kolom status atau `deleted_at`. Kata `deleted_at` tidak muncul di schema, migrasi, atau ERD.
- FK `employee_id` memakai `ON DELETE CASCADE` (`schema.prisma:124`, `apps/api/prisma/migrations/20261005113838_init/migration.sql:234`). FK `skill_id` memakai `ON DELETE RESTRICT` (`migration.sql:237`).
- Unique `(employee_id, skill_id)` ada di `schema.prisma:133` dan `migration.sql:204`. Unique ini menentukan apa yang terjadi saat penugasan diarsipkan lalu ditetapkan lagi.
- Tidak ada endpoint hapus karyawan di `apps/api/src`. Cascade karena karyawan dihapus hanya terjadi lewat akses database langsung, misalnya di tes dan fixture.

Pola yang sudah ada di repo, sebagai pembanding:

- Skill: kolom `is_active` (`schema.prisma:110`). Penugasan ke skill nonaktif tetap terbaca dengan `skillIsActive` (`apps/api/src/modules/skills/skills.views.ts:20-31`).
- Karyawan: kolom `status` dengan nilai ACTIVE dan INACTIVE (`schema.prisma:93`).
- Proyek: status `ARCHIVED` (`schema.prisma:27`).
- Alokasi: kolom `cancelled_at` (`docs/database/erd.md:237`).

`CLAUDE.md` (bagian Scope and Domain Rules) menyatakan bahwa catatan historis tidak di-hard-delete. Dokumen modul skills mencatat dampak saat ini: `created_by` dan `updated_by` baris penugasan ikut hilang, dan tes hanya memeriksa daftar kosong (`docs/architecture/modules/skills.md:105`).

Pembaca `employee_skills` yang sudah teridentifikasi:

- Modul skills: `skills.employee.repository.ts:40-68`.
- Detail karyawan di workforce: `apps/api/src/modules/workforce/workforce.repository.ts:32-35` membaca semua baris tanpa filter arsip. Mapping ada di `apps/api/src/modules/workforce/workforce.views.ts:98-106`.

Tes yang sudah ada untuk DELETE: `apps/api/tests/skills.test.ts:642-678` (204, daftar kosong, skill tetap ada, DELETE kedua menjawab 404), serta panggilan DELETE di baris 651, 673, 893, 1113, 1170, dan 1575 (race dengan PATCH).

Keputusan belum diambil. Kartu US02.02 menahan BE-01 sampai ada keputusan, dan melarang mengubah DELETE sebelum keputusan itu (`docs/tasks/sprint-1/US02.02.md:9-21`).

## Decision

Belum diputuskan. Tech Lead memilih salah satu opsi.

## Alternatives

### Opsi A: hard delete (perilaku sekarang)

- API: `DELETE` tetap menjawab 204. Penetapan ulang setelah hapus membuat baris baru lewat `createEmployeeSkill` (`skills.employee.repository.ts:79-87`). Kontrak tidak berubah.
- Migrasi: tidak ada.
- Data: level, `created_by`, dan `updated_by` dari baris yang dihapus hilang. Tidak ada salinan di repo.
- Tes: `apps/api/tests/skills.test.ts:642-678` tetap berlaku tanpa perubahan.
- Dampak terhadap aturan repo: opsi ini perlu dinilai terhadap aturan catatan historis di `CLAUDE.md`, karena baris penugasan dihapus secara fisik.

### Opsi B: arsip dengan kolom `status`

- API: `DELETE` mengubah baris menjadi arsip dan tetap bisa menjawab 204. Semua pembacaan (daftar, count, detail karyawan, dan view) harus memfilter baris arsip: `skills.employee.repository.ts:40-56`, `workforce.repository.ts:32-35`. Respons `EmployeeSkill` (`docs/api/openapi.yaml:1898-1914`) belum memuat status. Menambahkannya berarti kontrak diubah lebih dulu.
- Penetapan ulang: unique `(employee_id, skill_id)` (`migration.sql:204`) masih berlaku. Baris arsip akan membuat POST menjawab 409 `SKILL_ALREADY_ASSIGNED` (dipetakan di `apps/api/src/modules/skills/skills.errors.ts:40`). Keputusan perlu menyatakan apakah baris arsip diaktifkan lagi, atau unique diganti menjadi index parsial.
- Migrasi: menambah kolom baru. Kolom perlu nullable atau berdefault agar migrasi tetap aditif. Bila unique hanya berlaku untuk baris aktif, index parsial ditulis sebagai SQL di migrasi (`docs/database/migration-policy.md:13`).
- Data: baris yang sudah terhapus fisik sebelum migrasi tidak bisa dipulihkan dari repo.
- Tes: `apps/api/tests/skills.test.ts:642-678` perlu diubah karena baris tidak lagi hilang, dan perilaku DELETE kedua (404 atau 204) perlu ditentukan. Tes baru diperlukan untuk penetapan ulang setelah arsip, daftar dan detail yang tidak menampilkan baris arsip, dan race di `skills.test.ts:1575`.
- Dokumen: ERD `employee_skills` (`docs/database/erd.md:74`, `:195-202`) dan `docs/database/schema.dbml` perlu kolom baru.

### Opsi C: arsip dengan kolom `deleted_at`

- Dampak pada API, migrasi, dan tes sama dengan Opsi B.
- Perbedaannya: `deleted_at` (timestamp) mencatat waktu, tetapi tidak menyatakan status. Nama itu juga belum dipakai di repo. Kolom timestamp terdekat di repo adalah `cancelled_at` pada alokasi (`docs/database/erd.md:237`).
- Istilah berbeda antara dokumen: kontrak memakai "Remove" (`docs/api/openapi.yaml:950`), sedangkan kartu memakai "arsip/nonaktif" (`docs/tasks/sprint-1/US02.02.md:20`).

## Consequences

- Keputusan ini menentukan perilaku BR03 di level penugasan. Komentar kode dan kontrak saat ini hanya membahas level skill.
- Opsi B dan C mengubah kontrak sebelum kode (aturan OpenAPI-first di `CLAUDE.md`), membutuhkan migrasi, dan menambah tes di `apps/api/tests/skills.test.ts`.
- Opsi A tidak membutuhkan perubahan apa pun, tetapi selisih yang dicatat di `docs/architecture/modules/skills.md:105` tetap terbuka.
- Keputusan ini juga menyentuh `ON DELETE CASCADE` di `employee_skills` (`migration.sql:234`). Catatan di `docs/database/indexes.md:65` menyebut bahwa aturan Cascade perlu ditinjau bersama keputusan DELETE penugasan.

## Belum diverifikasi

- Teks TSD §9.3 dan §12.1 tentang referensi historis: tidak ada di repo. Kutipan di `docs/tasks/sprint-1/US02.02.md:23` dan `docs/database/indexes.md:65` belum diverifikasi.
- Teks PRD BR03 dan AC02.01 tentang penghapusan penugasan: tidak ada di repo.
- Apakah ada laporan atau audit yang membaca baris penugasan yang sudah dihapus: belum ada di repo.
- Daftar lengkap pembaca `employee_skills`: belum diverifikasi penuh. Yang sudah ditemukan adalah modul skills dan workforce.
- Jumlah baris `employee_skills` di data yang berjalan: tidak ada di repo.
- Kemampuan Prisma 7 di repo untuk memodelkan index parsial: belum diuji.
