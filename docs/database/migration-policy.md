# Kebijakan Migrasi Database

Setiap perubahan schema lewat Prisma migration yang di-commit. Dokumen ini menjelaskan langkahnya.

Sumber: `CLAUDE.md` (bagian Database, Storage, and Security) dan TSD §12.3. Teks TSD tidak ada di repo. Aturan produksi dari TSD §12.3 dikutip di sini.

## Aturan

1. **Hanya lewat migration.** Schema tidak diubah manual di database. Perubahan dimulai dari `apps/api/prisma/schema.prisma`, lalu migration dibuat dengan Prisma.
2. **Produksi tidak memakai `db push`.** Produksi menjalankan `prisma migrate deploy` (TSD §12.3).
3. **Migration yang sudah di-merge tidak diedit.** Perubahan berikutnya dibuat sebagai migration baru. *Usulan dokumen ini, belum tertulis di `CLAUDE.md` atau TSD.*
4. **Schema dan migration sinkron.** CI menjalankan `prisma migrate diff --from-config-datasource --to-schema=prisma/schema.prisma --exit-code`. Exit code 2 berarti ada drift (`.github/workflows/ci.yml`, baris 71–74).
5. **Constraint yang tidak bisa dinyatakan Prisma ditulis sebagai SQL di migration.** Contohnya index `lower(name)`. Prisma schema tidak memodelkannya.

## Langkah menambah perubahan schema

1. Ubah `apps/api/prisma/schema.prisma`.
2. Buat migration. Untuk lokal: `npm run db:migrate -w @staffora/api`. Beri nama yang menjelaskan perubahan.
3. Bila perlu constraint yang tidak didukung Prisma, tambahkan SQL di file `migration.sql` yang sama.
4. Perbarui [`docs/database/erd.md`](erd.md) dan [`schema.dbml`](schema.dbml) di PR yang sama. Ini diwajibkan `CLAUDE.md`.
5. Jalankan pemeriksaan drift:
   ```bash
   npx prisma migrate diff --from-config-datasource --to-schema=prisma/schema.prisma --exit-code
   ```
   Hasil yang benar adalah "No difference detected" dengan exit code 0.
6. Perbarui [indexes](indexes.md) bila ada index atau constraint baru.

## Menjalankan migration

| Lingkungan | Perintah | Catatan |
| --- | --- | --- |
| Lokal | `npm run db:migrate -w @staffora/api` | Membuat migration baru bila schema berubah |
| CI dan produksi | `npm run db:migrate:deploy -w @staffora/api` | Hanya menerapkan migration yang ada |
| Seed | `npm run db:seed -w @staffora/api` | Data pengembangan. Tidak dijalankan di produksi (*usulan, belum tertulis di TSD*) |

## Penamaan

Folder migration memakai format `YYYYMMDDHHMMSS_nama_perubahan`. Migration yang ada:

- `20261005113838_init`
- `20261014160000_workforce_normalized_name_uniqueness`
- `20261018120000_skills_normalized_name_uniqueness`

## Lingkungan uji

Tes integrasi memerlukan PostgreSQL 18 dengan migration yang sudah diterapkan. Contoh untuk Postgres di container:

```bash
docker run -d --name staffora-pg -e POSTGRES_USER=staffora -e POSTGRES_PASSWORD=<password-lokal> -e POSTGRES_DB=staffora -p 15432:5432 postgres:18
DATABASE_URL="postgresql://staffora:<password-lokal>@localhost:15432/staffora" npm run db:migrate:deploy -w @staffora/api
DATABASE_URL="postgresql://staffora:<password-lokal>@localhost:15432/staffora" npm test
```

Ganti `<password-lokal>` dengan nilai dari `apps/api/.env` milikmu. Jangan menuliskan nilainya di dokumen atau commit.

## Pertanyaan terbuka

- Apakah perlu aturan tambahan untuk migrasi yang mengubah data, misalnya backfill? Belum ada aturan di repo.
- Apakah `CHECK` yang belum ada di [indexes](indexes.md) dibuat dalam satu migration atau per modul? Keputusan Tech Lead.
