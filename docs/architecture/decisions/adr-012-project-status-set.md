# ADR-012: Himpunan status proyek

- **Status**: Proposed
- **Decision Date**: —
- **Technical Decision ID**: belum ditetapkan (usulan)
- **Sumber**: TSD §9.3 (dikutip di `docs/database/erd.md:235` untuk status alokasi; teks TSD tidak ada di repo), PRD US03.01 (ID belum dipetakan ke AC di repo, lihat `docs/architecture/modules/projects.md:56`)

## Context

Repo memakai himpunan status proyek yang sama di kode, skema, dan kontrak: `DRAFT`, `PLANNED`, `ACTIVE`, `COMPLETED`, `ARCHIVED`.

- Zod: `apps/api/src/modules/projects/projects.schema.ts:15`, `:36`, `:55`. Default `DRAFT` ada di baris 16.
- Prisma: enum `ProjectStatus` di `apps/api/prisma/schema.prisma:22-28`. Kolom `status` berdefault `DRAFT` di baris 146.
- Migrasi awal: `apps/api/prisma/migrations/20261005113838_init/migration.sql:8` (tipe enum) dan baris 113 (default kolom).
- ERD: `docs/database/erd.md:92` dan `:210`.
- OpenAPI: `docs/api/openapi.yaml:1003`, `:2070-2071`, `:2082`, `:2105`.

Klaim pada tugas, bahwa TSD §9.3 hanya menyebut `PLANNED`, `ACTIVE`, `COMPLETED`, dan `ARCHIVED`, belum bisa diverifikasi karena teks TSD tidak ada di repo. Di repo, §9.3 dikutip untuk status alokasi (`docs/database/erd.md:235`), yaitu `CANCELLED`, `PLANNED`, `ACTIVE`, dan `ENDED`, bukan status proyek. Himpunan status alokasi itu berbeda, tetapi berbagi dua nama dengan status proyek (`docs/api/openapi.yaml:2275`, `apps/api/src/modules/workforce/workforce.views.ts:113`). Dokumen modul projects sudah mencatat klaim TSD ini sebagai hal yang belum bisa dicek (`docs/architecture/modules/projects.md:83`).

Perilaku yang relevan dengan keputusan ini:

- Default `DRAFT` hanya berlaku bila create membawa status kosong (`projects.schema.ts:14-16`). Create saat ini selalu melempar `NotImplementedError` (`apps/api/src/modules/projects/projects.service.ts:29-31`), sehingga default itu belum bisa dicapai lewat API.
- Seed membuat proyek dengan `status: "ACTIVE"` secara eksplisit (`apps/api/prisma/seed.ts:237`), tidak bergantung pada `DRAFT`.
- Tidak ada aturan transisi status di kode (`docs/architecture/modules/projects.md:59`). Kontrak dan Zod menerima `status` pada PATCH, tetapi service hanya menerapkan `name` (`docs/architecture/modules/projects.md:90`).
- Filter `status` pada daftar proyek memakai enum yang sama (`projects.schema.ts:54-56`), sehingga `DRAFT` juga tersedia sebagai nilai filter.
- Web belum memakai nilai status. Halaman proyek masih placeholder (`apps/web/src/features/projects/projects-page.tsx:18`). Nilai status hanya muncul di `apps/web/src/api/schema.d.ts`, yang dibangkitkan dari OpenAPI.

## Decision

Belum diputuskan. Tech Lead memilih salah satu opsi.

## Alternatives

### Opsi A: pertahankan `DRAFT`

- Kode, Prisma, migrasi, ERD, dan OpenAPI tidak berubah. Tidak ada migrasi.
- API: kontrak dan filter tidak berubah. Klien yang sudah mengirim atau membaca `DRAFT` tetap kompatibel.
- Database: enum PostgreSQL tetap berisi lima nilai.
- Dokumen: `docs/architecture/modules/projects.md:80-83` tetap mencatat selisih dengan klaim TSD sampai klaim itu bisa diverifikasi. `docs/architecture/overview.md:58` tetap memuat lima nilai.
- Tes: tidak ada tes di `apps/api/tests` yang memakai `DRAFT`, jadi tidak ada tes yang perlu berubah.
- Aturan status awal dan transisi tetap belum ada di repo. Opsi ini tidak mengubahnya.

### Opsi B: hapus `DRAFT` dari kode, OpenAPI, dan ERD

- Kode: hapus `DRAFT` dari tiga enum Zod (`projects.schema.ts:15`, `:36`, `:55`) dan ganti default di baris 16. Hapus juga dari `apps/api/prisma/schema.prisma:23` dan ganti default di baris 146. Status awal pengganti belum ditentukan di repo.
- Migrasi: mengubah enum PostgreSQL memerlukan migrasi baru. Repo belum punya contoh penghapusan nilai enum; satu-satunya migrasi enum adalah `init` (`migration.sql:8`). Migrasi perlu membuat tipe baru, memetakan baris `DRAFT` ke nilai lain, mengganti default kolom, lalu menghapus tipe lama. Migrasi yang sudah di-merge tidak diedit (`docs/database/migration-policy.md:11`).
- Data: pemetaan baris `DRAFT` yang sudah ada adalah keputusan data. Jumlah baris itu di lingkungan mana pun tidak ada di repo.
- API: `status=DRAFT` pada query dan nilai `DRAFT` pada respons tidak lagi valid. Perubahan masuk ke `docs/api/openapi.yaml` (`:1003`, `:2070-2071`, `:2082`, `:2105`) lebih dulu, lalu `npm run api:types` membangkitkan ulang `apps/web/src/api/schema.d.ts`.
- Dokumen: ERD (`docs/database/erd.md:92`, `:210`), `docs/database/schema.dbml:119`, dan `docs/architecture/overview.md:58` ikut berubah dalam PR yang sama (`docs/database/migration-policy.md:20`).
- Tes: tidak ada tes lama yang berubah. Perlu tes baru untuk status awal pengganti dan untuk pemetaan data pada migrasi. Tes integrasi memerlukan PostgreSQL 18 dengan migrasi terpasang (`docs/database/migration-policy.md:46`).
- Seed tidak terdampak karena status proyek di seed sudah eksplisit (`apps/api/prisma/seed.ts:237`).

## Consequences

- Selama keputusan belum diambil, tidak ada perubahan kode, kontrak, atau migrasi untuk status proyek.
- Kedua opsi menyentuh bagian yang sama di `docs/architecture/modules/projects.md:80-83`. Setelah keputusan, bagian itu perlu merujuk ke ADR ini.
- Opsi B mengubah kontrak dan skema. `CLAUDE.md` (tabel Local Skills and Commands dan bagian Database, Storage, and Security) mengharuskan OpenAPI diubah lebih dulu untuk perubahan API, dan perubahan skema dilakukan lewat migrasi Prisma.
- Keputusan ini tidak mengubah aturan transisi status. Aturan itu belum ada di repo dan membutuhkan keputusan terpisah.

## Belum diverifikasi

- Teks TSD §9.3 tentang himpunan status proyek: tidak ada di repo. Kutipan §9.3 di atas hanya menunjuk ke repo, bukan ke isi TSD.
- Teks PRD US03.01 tentang status proyek: tidak ada di repo.
- Jumlah dan nilai baris `projects.status = 'DRAFT'` di database mana pun: tidak ada di repo.
- Cara Prisma 7 di repo memetakan perubahan enum, dan apakah `prisma migrate diff` (`docs/database/migration-policy.md:23`) menandai drift setelah migrasi enum: belum diuji.
- Status awal pengganti `DRAFT` bila Opsi B dipilih: keputusan produk, belum ada di repo.
