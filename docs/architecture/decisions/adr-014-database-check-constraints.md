# ADR-014: Constraint CHECK di database

- **Status**: Proposed
- **Decision Date**: —
- **Technical Decision ID**: belum ditetapkan (usulan)
- **Sumber**: TSD §12.1 (dikutip di `docs/database/indexes.md:44-45`, `:48`, dan `docs/README.md:57`; teks TSD tidak ada di repo). TSD §12.3 untuk aturan migrasi produksi (dikutip di `docs/database/migration-policy.md:10`). PRD: belum ada ID AC yang dipetakan untuk constraint ini di repo.

## Context

Repo mencatat tiga CHECK yang belum ada di database: level proficiency 1 sampai 5, persentase alokasi 1 sampai 100, dan `end_date >= start_date` (`docs/database/indexes.md:41-48`; `docs/README.md:57`). Dua baris di `indexes.md` (baris 44 dan 45) mengutip TSD §12.1. Baris level proficiency (baris 43) hanya menyebut validasi Zod.

Pemeriksaan migrasi: pencarian `CHECK` tanpa membedakan huruf besar dan kecil di `apps/api/prisma` tidak menemukan apa pun. Ada tiga migrasi:

- `apps/api/prisma/migrations/20261005113838_init`
- `apps/api/prisma/migrations/20261014160000_workforce_normalized_name_uniqueness`
- `apps/api/prisma/migrations/20261018120000_skills_normalized_name_uniqueness`

Kolom yang akan dijaga, beserta validasi aplikasi yang ada:

| Kolom | Definisi | Validasi aplikasi |
| --- | --- | --- |
| `employee_skills.proficiency_level` | `schema.prisma:127`; `migration.sql:96` (`INTEGER NOT NULL`) | `apps/api/src/modules/skills/skills.schema.ts:41-45` (min 1, max 5) |
| `staffing_requirement_skills.minimum_proficiency_level` | `migration.sql:144` | `apps/api/src/modules/staffing/staffing.schema.ts:14` (min 1, max 5) |
| `staffing_requirements.allocation_percentage` | `schema.prisma:165` | `staffing.schema.ts:22-26` dan `:39` (1 sampai 100) |
| `allocations.allocation_percentage` | `schema.prisma:205` | `apps/api/src/modules/allocations/allocations.schema.ts:9-13` dan `:29` (1 sampai 100) |
| `projects.end_date` | `schema.prisma:145` | `apps/api/src/modules/projects/projects.schema.ts:18-21` dan `:39-50` |
| `allocations.end_date` | `schema.prisma:207` | `allocations.schema.ts:21` dan `:39` |
| `staffing_requirements.end_date` | `schema.prisma:167` | Tidak ditemukan. `staffing.schema.ts:27-44` hanya memvalidasi format. `staffing.service.ts:64-65` dan `:104-105` hanya mengonversi tanggal. |

Catatan tambahan:

- `docs/database/erd.md:199` menyebut level proficiency sebagai "Integer constraint" antara 1 dan 5. `erd.md:209` menyebut aturan `end_date >= start_date`. `erd.md:218` dan `:226` menyebut persentase alokasi 1 sampai 100. Ketiganya ditulis sebagai aturan data, tanpa menyebut apakah database menjaganya.
- Pola yang sudah ada di repo: `docs/database/erd.md:183` mencatat bahwa migrasi `20261014160000_workforce_normalized_name_uniqueness` memiliki blok pra-cek yang menolak berjalan bila masih ada duplikat. Pola ini bisa dipakai untuk constraint baru.
- Aturan repo: constraint yang tidak bisa dinyatakan Prisma ditulis sebagai SQL di migrasi (`docs/database/migration-policy.md:13`). Produksi memakai `db:migrate:deploy` (`docs/database/migration-policy.md:33`).
- Penanganan error: `apps/api/src/common/errors/unique-violation.ts:64-65` hanya memetakan P2002. Tidak ada pemetaan untuk pelanggaran CHECK.
- Seed menulis data langsung ke database (contoh: `apps/api/prisma/seed.ts:237`). Apakah nilainya lolos CHECK belum diverifikasi.

Keputusan belum diambil. `docs/database/migration-policy.md:59` mencatat pertanyaan terbuka tentang apakah CHECK dibuat dalam satu migrasi atau per modul, dan menyatakan bahwa itu keputusan Tech Lead.

## Decision

Belum diputuskan. Tech Lead memilih salah satu opsi.

## Alternatives

### Opsi A: tambahkan CHECK lewat SQL di migrasi

- Migrasi: tulis `ALTER TABLE ... ADD CONSTRAINT ... CHECK (...)` di file `migration.sql` (`docs/database/migration-policy.md:13`). Tabel yang terdampak: `employee_skills`, `staffing_requirement_skills`, `staffing_requirements`, `allocations`, dan `projects`. Pilihan satu migrasi atau beberapa migrasi belum diputuskan (`migration-policy.md:59`).
- Data: bila baris yang ada melanggar, migrasi gagal saat `db:migrate:deploy`. Perlu pra-cek seperti `erd.md:183`. Jumlah baris yang melanggar belum diketahui.
- Schema Prisma: `schema.prisma` tidak memuat CHECK. CI menjalankan `prisma migrate diff` dengan `--exit-code` (`docs/database/migration-policy.md:12`). Apakah CHECK tersebut dianggap drift belum diuji.
- API: tidak ada perubahan kontrak. Pelanggaran yang lolos Zod, misalnya lewat seed atau SQL manual, menjadi error database. Repo belum memetakan error itu. Pemetaan dan status code-nya belum ditentukan. Pemetaan akan masuk ke `apps/api/src/common/errors` sebagai keputusan terpisah.
- Dokumen: `docs/database/indexes.md:43-45` dan `docs/README.md:57` berubah dari "Tidak ada" menjadi terpasang. `docs/database/erd.md` dan `docs/database/schema.dbml` diperbarui dalam PR yang sama (`docs/database/migration-policy.md:20`).
- Tes: perlu tes integrasi di `apps/api/tests` yang mencoba memasukkan nilai di luar rentang lalu memastikan database menolaknya. Tes integrasi membutuhkan PostgreSQL 18 dengan migrasi terpasang (`docs/database/migration-policy.md:46`). Tes Zod yang ada tidak membuktikan hal ini. `apps/api/tests/skills.test.ts:712` menguji level 0 dan 6 hanya di lapisan API.

### Opsi B: andalkan Zod dan service

- Migrasi: tidak ada.
- API: tidak ada perubahan. Tes validasi yang ada tetap berlaku, misalnya `apps/api/tests/skills.test.ts:712`.
- Data: seed dan SQL manual tidak dijaga database. Ini sudah dicatat di `docs/database/indexes.md:48`.
- Kesesuaian dengan kutipan TSD: opsi ini tidak memenuhi kutipan TSD §12.1 di `docs/database/indexes.md:44-45` dan `docs/README.md:57`, bila kutipan itu benar.
- Gap yang tetap ada: `staffing_requirements.end_date` belum punya pemeriksaan terhadap `start_date` (lihat tabel di Context). Opsi ini tidak menutupnya tanpa perubahan di Zod atau service, yang juga keputusan terpisah.
- Dokumen: ERD `docs/database/erd.md:199` memakai kata "constraint" untuk validasi aplikasi. Istilah itu perlu disesuaikan bila opsi ini dipilih. `docs/database/indexes.md` perlu menyatakan bahwa tiga CHECK tidak dibuat.
- Tes: tidak ada tes database baru.

## Consequences

- Keputusan ini hanya menyangkut batas nilai dan urutan tanggal. Tidak mengubah kapasitas, sweep-line, atau kunci baris.
- Opsi A menjadikan database sebagai penjaga terakhir, dengan biaya migrasi dan pra-cek tambahan.
- Opsi A dan B sama-sama memerlukan keputusan untuk gap `staffing_requirements.end_date`.
- Keputusan ini menyentuh `docs/database/indexes.md` dan `docs/README.md`, yang juga mencatat tiga CHECK tersebut.

## Belum diverifikasi

- Teks TSD §12.1 tentang tiga CHECK: tidak ada di repo. Kutipan di `indexes.md` dan `docs/README.md` belum diverifikasi.
- Apakah `prisma migrate diff` menandai CHECK sebagai drift: belum diuji.
- Kode Prisma dan HTTP untuk pelanggaran CHECK di repo: belum diuji, dan belum ada pemetaan di `apps/api/src/common/errors`.
- Jumlah baris yang melanggar di data yang berjalan: tidak ada di repo.
- Apakah isi `apps/api/prisma/seed.ts` lolos seluruh CHECK: belum diuji.
- Apakah `staffing_requirements` wajib memenuhi `end_date >= start_date`: aturan PRD tidak ada di repo.
