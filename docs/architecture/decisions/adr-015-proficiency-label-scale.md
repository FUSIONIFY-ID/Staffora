# ADR-015: Label skala proficiency

- **Status**: Proposed
- **Decision Date**: —
- **Technical Decision ID**: belum ditetapkan (usulan)
- **Sumber**: PRD US02.02 AC03.01 sampai AC03.05 (ID dari `docs/tasks/sprint-1/US02.02.md:3` dan `:27-29`; teks PRD tidak ada di repo). ERD (`docs/database/erd.md:78` dan `:199`). TSD tidak dikutip untuk label ini.

## Context

Lima label untuk level 1 sampai 5 tercatat di kartu US02.02: Beginner, Basic, Intermediate, Advanced, Expert (`docs/tasks/sprint-1/US02.02.md:32`). Kartu itu berstatus blocked. Tech Lead perlu memutuskan apakah label menjadi field API atau cukup di UI (`docs/tasks/sprint-1/US02.02.md:28`). Kartu juga menyebut `EmployeeSkill` sebagai schema yang akan diubah bila label menjadi field API (`:32`), dan menulis "Migration: tidak" (`:33`).

Status label di repo:

- Pencarian `Beginner|Basic|Intermediate|Advanced|Expert` pada kode, dokumen, dan seed menemukan label hanya di: `docs/tasks/sprint-1/US02.02.md:32` dan `:41`, `docs/database/erd.md:78` dan `:199`, `docs/architecture/modules/skills.md:103`, serta komentar di `apps/api/prisma/seed.ts:152` (`// Advanced`) dan `:169` (`// Expert`). Pencarian tidak mencakup folder tooling lokal.
- ERD hanya menyebut ujung skala: level 1 sebagai Beginner dan level 5 sebagai Expert (`docs/database/erd.md:78`, `:199`).
- Level 2 sampai 4 tidak punya label di repo selain daftar di kartu (`docs/architecture/modules/skills.md:103`).
- Pemetaan urut (1 Beginner, 2 Basic, 3 Intermediate, 4 Advanced, 5 Expert) tidak ditulis sebagai aturan di repo. ERD dan komentar seed sesuai dengan urutan itu di level 1, 4, dan 5, tetapi itu inferensi, bukan aturan.

Kode, kontrak, dan UI:

- `proficiencyLabel` tidak ditemukan di `apps/api/src`, `apps/web/src`, atau `docs/api/openapi.yaml`.
- Schema `EmployeeSkill` di OpenAPI memuat `proficiencyLevel` sebagai integer 1 sampai 5 (`docs/api/openapi.yaml:1898-1914`), tanpa field label.
- View menyalin angka apa adanya: `apps/api/src/modules/skills/skills.views.ts:24-34` dan `apps/api/src/modules/workforce/workforce.views.ts:98-106`. Dua mapper ini sudah terpisah (`docs/architecture/modules/skills.md:111`).
- Validasi level di `apps/api/src/modules/skills/skills.schema.ts:41-45` hanya memeriksa rentang 1 sampai 5.
- Filter Resource Finder memakai angka (`apps/api/src/modules/resource-finder/resource-finder.schema.ts:14`).
- Halaman skill di web masih placeholder (`apps/web/src/features/skills/skills-page.tsx:18`).
- Tipe web dibangkitkan dari OpenAPI lewat `npm run api:types` (`CLAUDE.md`, bagian Local Commands).
- Bahasa copy UI bisnis adalah Bahasa Indonesia atau English sesuai PRD (`CLAUDE.md`, bagian Scope and Domain Rules). Bahasa untuk label belum ditetapkan di repo.
- Tes wajib di kartu adalah "returns proficiency label for levels 1–5" (`docs/tasks/sprint-1/US02.02.md:36`). Tes dengan nama itu belum ada di `apps/api/tests`. Tes yang ada untuk level hanya memeriksa rentang 1 dan 5 (`apps/api/tests/skills.test.ts:712`).

Keputusan belum diambil. Kartu US02.02 menahan BE-02 sampai keputusan ini ada (`docs/tasks/sprint-1/US02.02.md:27-41`).

## Decision

Belum diputuskan. Tech Lead memilih salah satu opsi.

## Alternatives

### Opsi A: tambahkan `proficiencyLabel` di API

- Kontrak: tambahkan field di schema `EmployeeSkill` (`docs/api/openapi.yaml:1898-1914`). Respons lain yang memuat level (misalnya detail karyawan dan staffing requirement skills) perlu diperiksa juga. Daftar itu belum dibuat di repo. Kontrak diubah lebih dulu (`CLAUDE.md`).
- Kode: pemetaan level ke label ditulis di satu tempat, lalu dipakai oleh `skills.views.ts` dan `workforce.views.ts`. Tanpa satu sumber, dua mapper bisa menghasilkan label yang berbeda.
- Migrasi: tidak perlu bila label dihitung dari angka (`docs/tasks/sprint-1/US02.02.md:33`). Bila label disimpan di tabel, perlu migrasi dan keputusan untuk data yang sudah ada.
- Web: `npm run api:types` membangkitkan ulang `apps/web/src/api/schema.d.ts`. Halaman skill memakai field baru saat diimplementasikan.
- Tes: `apps/api/tests/skills.test.ts` perlu tes untuk level 1 sampai 5 sesuai kartu (`docs/tasks/sprint-1/US02.02.md:36`).
- Bahasa: bila API memuat label, bahasa label menjadi bagian dari kontrak.

### Opsi B: tampilkan label di UI saja

- Kontrak: tidak berubah. API tetap mengembalikan angka 1 sampai 5. Klien selain UI tidak mendapat label.
- API: tidak ada perubahan kode dan tes.
- Migrasi: tidak ada (`docs/tasks/sprint-1/US02.02.md:33`).
- Web: pemetaan level ke label ditulis di sisi UI. Lokasinya belum ditentukan di repo, dan halaman skill masih placeholder (`apps/web/src/features/skills/skills-page.tsx:18`). Tes pemetaan bisa ditulis di `apps/web/tests/`.
- Risiko: label yang dipakai di luar UI, misalnya laporan atau ekspor, harus menyalin pemetaan. Pemetaan di UI juga harus mengikuti aturan bahasa copy di `CLAUDE.md`.
- Kartu menyebut opsi ini sebagai salah satu jalur keputusan (`docs/tasks/sprint-1/US02.02.md:28`).

## Consequences

- Tanpa keputusan, BE-02 tetap blocked dan kontrak `EmployeeSkill` tidak boleh diubah (`docs/tasks/sprint-1/US02.02.md:27-41`).
- Opsi A menambah field kontrak yang harus dijaga konsisten di beberapa modul. Opsi B menempatkan pemetaan di lapisan UI yang belum ada.
- Keputusan ini tidak mengubah rentang level 1 sampai 5. Kartu menyatakan bahwa perubahan rentang berada di luar scope (`docs/tasks/sprint-1/US02.02.md:35`).
- Keputusan bahasa label perlu dijawab bersama keputusan API atau UI.

## Belum diverifikasi

- Teks PRD US02.02 AC03.01 sampai AC03.05 tentang label: tidak ada di repo. Daftar lima label hanya berasal dari kartu US02.02.
- Pemetaan level 2, 3, dan 4 ke label: tidak ada di repo.
- Bahasa label (Bahasa Indonesia atau English): belum ditetapkan.
- Apakah label juga dibutuhkan di respons staffing requirement atau Resource Finder: belum diputuskan.
- Pencarian label tidak mencakup folder tooling lokal, sehingga hasil "tidak ditemukan" berlaku untuk kode, dokumen, dan seed yang dicari.
