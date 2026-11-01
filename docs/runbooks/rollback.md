# Runbook: Rollback Aplikasi dan Mitigasi Migrasi Database

- **Pemilik**: QA & DevOps (Fikri) menjalankan prosedur. Tech Lead (Arya Isnaidi) memutuskan setiap langkah yang menyentuh database.
- **Kapan dipakai**: Bug kritis setelah rilis produksi, health check gagal setelah rilis, migrasi gagal di tengah deployment, atau data rusak akibat rilis.
- **Risiko**: Rollback aplikasi ke versi yang tidak cocok dengan skema bisa membuat endpoint error (HTTP 500). Restore database menghilangkan data yang masuk setelah backup. Build ulang dari sumber bisa menghasilkan image yang berbeda dari rilis asli.
- **Terakhir diuji**: Belum pernah diuji. Repo tidak memuat catatan uji rollback, dan `git tag` kosong (per 2026-11-01).

Catatan: prosedur ini disusun dengan membaca kode dan konfigurasi repo, bukan dengan menjalankannya. Perintah `docker compose` memakai file compose yang ada di repo. Subperintah `images`, `logs`, dan `ps` adalah CLI standar Docker Compose. Hal yang tidak ada di repo ditulis "belum ada di repo" dan dicatat di bagian Belum diverifikasi. Nomor bagian TSD (12.3 dan 16.6) dikutip dari dokumen repo; teks TSD tidak ada di repo.

---

## Prasyarat

### Blocker di kondisi repo sekarang

Prosedur di bawah belum bisa dijalankan apa adanya. Temuan ini didapat dari membaca file:

1. **Tidak ada image tag atau registry.** Service `api` dan `web` hanya punya `build:` (`docker-compose.yml` baris 18-20 untuk `api`). Overlay produksi tidak menambah `image:` (`docker-compose.prod.yml`). Variabel `STAFFORA_VERSION` dipakai di runbook versi lama, tetapi belum ada di repo, sehingga perintah lama tidak mengubah image apa pun. ADR-008 menargetkan image bertag SHA dan semver di GHCR (`docs/architecture/decisions/adr-008-ci-cd-pipeline.md` baris 18), tetapi belum diimplementasikan.
2. **Target rollback belum ada.** Tidak ada git tag. Versi stabil sebelumnya tidak bisa ditentukan dari repo.
3. **Workflow produksi hanya membangun image.** `.github/workflows/deploy-production.yml` baris 20-23 hanya menjalankan `build` dan `echo`. Tidak ada langkah deploy, migrate, health check, atau key `environment:` untuk approval manual.
4. **Overlay produksi tidak bisa dipakai sendirian.** `docker-compose.prod.yml` hanya berisi override. Dengan `-f docker-compose.prod.yml` saja, service `api` dan `db` tidak punya `build:` atau `image:` (berdasarkan isi file, belum dijalankan). Selalu pakai dua file: `-f docker-compose.yml -f docker-compose.prod.yml`, seperti di `deploy-production.yml` baris 22.
5. **Database tidak bisa dijangkau dari host VM.** `docker-compose.prod.yml` baris 4 me-reset `ports` untuk `db`. Perintah backup atau restore dengan `-h localhost` tidak akan terhubung.
6. **Image runtime API tidak memuat skema Prisma.** `apps/api/Dockerfile` baris 18-24 hanya menyalin `package*.json`, `node_modules`, `apps/api/package.json`, dan `apps/api/dist`. Folder `prisma/` dan `prisma.config.ts` tidak ikut. Jadi `prisma migrate deploy` dari container `api` tidak menemukan schema. Ini dibaca dari Dockerfile, belum dijalankan.
7. **Fallback SESSION_SECRET.** `docker-compose.prod.yml` baris 8 dan `docker-compose.yml` baris 25 punya nilai fallback. Validasi di `apps/api/src/config/env.ts` baris 19-22 hanya mengecek ada dan panjang, sehingga fallback lolos. Nilai harus diset eksplisit dari sumber secret di VM.
8. **Login tidak bisa diverifikasi lewat HTTP.** `apps/web/nginx.conf` hanya listen port 80 (baris 2) dan tidak meneruskan `X-Forwarded-Proto` (baris 5). `apps/api/src/common/auth/session.ts` baris 49 memasang cookie `secure` di production, dan `apps/api/src/app.ts` baris 54 memasang `trust proxy` hanya di production. Akibatnya cookie session tidak tersimpan di stack produksi tanpa TLS. ADR-007 baris 15 menyebut Nginx mengakhiri TLS, dan itu belum ada di repo.

### Akses dan secret (sebut nama saja)

- Akses ke VM produksi dan lokasi folder deploy di VM: belum ada di repo.
- Clone repo di VM untuk `git checkout`: belum ada di repo. Prosedur ini mengasumsikan VM punya clone.
- Variabel yang harus tersedia di VM: `SESSION_SECRET` dan `DATABASE_URL`. Keduanya wajib di production (`apps/api/src/config/env.ts` baris 13-22). Tempat penyimpanan dan cara menyuntikkannya belum ada di repo.
- Kredensial database produksi: belum ada di repo. `docker-compose.yml` baris 6 dan 24 memakai kredensial lokal yang ditulis langsung, dan overlay produksi tidak menimpanya. Jangan memakai nilai itu sebagai acuan produksi.
- Backup pra-rilis: belum ada skrip backup atau restore di repo. `docs/runbooks/deployment.md` menuliskan langkah backup, tetapi perintahnya belum diuji.

### Keputusan Tech Lead sebelum mulai

- Mekanisme image: rebuild dari commit (langkah C) atau registry GHCR dengan tag SHA (ADR-008, belum ada).
- Commit SHA target rollback dan daftar rilis stabil.
- Apakah migration pada rilis yang di-rollback boleh dibiarkan (lihat bagian D).
- Siapa yang berwenang memulai restore database, dan kapan.

---

## Langkah

### A. Hentikan dan catat (tidak mengubah apa pun)

1. Hentikan semua rilis dan migrasi manual yang sedang berjalan.
2. Catat commit SHA yang sedang berjalan. Belum ada di repo: mekanisme pencatatan otomatis.
3. Catat image ID tiap service:
   `docker compose -f docker-compose.yml -f docker-compose.prod.yml images`
4. Pastikan backup pra-rilis ada. Jika tidak ada, berhenti dan lapor Tech Lead sebelum menyentuh database.

### B. Cek kompatibilitas migrasi (read-only)

5. Bandingkan folder migration antara target dan versi sekarang:
   `git diff --name-only <sha-target> <sha-sekarang> -- apps/api/prisma/migrations`
   - Hasil kosong: tidak ada migration baru. Lanjut ke langkah 6.
   - Ada folder baru: berhenti. Rollback aplikasi ke target bisa berjalan di skema yang lebih baru. Lanjut hanya setelah keputusan Tech Lead (bagian D).

### C. Rollback aplikasi (rebuild dari commit target)

6. Pastikan working tree bersih, lalu checkout target: `git checkout <sha-target>`
7. Pastikan `SESSION_SECRET` diset eksplisit dari sumber secret VM. Jangan mengandalkan fallback di compose.
8. Build ulang api dan web:
   `docker compose -f docker-compose.yml -f docker-compose.prod.yml build api web`
   - Build harus selesai sebelum `up`. Perilaku `up` tanpa `--build` terhadap image lama belum diverifikasi, jadi jangan mengandalkannya.
   - Base image `node:24-alpine` (`apps/api/Dockerfile` baris 1 dan 18) dan `nginx:alpine` (`apps/web/Dockerfile` baris 17) tidak di-pin. Hasil build bisa berbeda dari rilis asli.
9. Ganti container:
   `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d api web`
   - Service `db` tidak diganti karena tidak berubah.
   - Compose mengganti container `api` dan `web`, sehingga ada jeda layanan. Klaim zero-downtime di `deployment.md` belum diverifikasi.
   - Jangan menghapus volume `staffora_pgdata` (`docker-compose.yml` baris 11). Menghapus volume berarti menghilangkan seluruh data database.
10. Lanjut ke Verifikasi akhir.

Target rollback harus memuat `api` dan `web` dari commit yang sama, supaya kontrak API dan SPA tetap cocok.

### D. Mitigasi migrasi database

Fakta dasar: repo ini tidak memiliki down migration. Setiap folder di `apps/api/prisma/migrations/` hanya berisi `migration.sql`. `apps/api/package.json` baris 15-16 hanya punya `db:migrate` (dev) dan `db:migrate:deploy`. Jadi membalik migration berarti salah satu dari dua hal: migration maju yang membalik perubahan, atau restore dari backup.

Aturan yang ada di repo:
- Produksi memakai `prisma migrate deploy`, bukan `db push` (`docs/database/migration-policy.md` baris 10).
- Migration yang sudah di-merge tidak diedit (`migration-policy.md` baris 11, berstatus usulan).
- Migration produksi harus aditif dan backward-compatible (`docs/CODING_STANDARD.md` baris 197).
- CI menjalankan `migrate deploy` pada database sekali pakai (`.github/workflows/ci.yml` baris 67) dan memeriksa drift (baris 72-74). Keduanya tidak menguji rollback.

| Kondisi | Langkah aman | Keputusan Tech Lead |
| --- | --- | --- |
| Migration gagal, container app belum diganti | Berhenti. Jangan jalankan `up`. Periksa status migration (lihat Jika gagal) | Perbaikan maju atau restore |
| Migration sukses, app baru bermasalah, migration aditif | Rollback aplikasi (langkah 6-9) | Tidak wajib jika cek langkah 5 bersih |
| Migration sukses, app baru bermasalah, ada migration non-aditif | Berhenti | Wajib |
| Data rusak akibat rilis | Berhenti. Jangan menulis SQL manual | Wajib, termasuk restore (bagian E) |

Perbaikan maju (forward fix): buat migration baru lewat PR normal, perbarui `docs/database/erd.md` dan `schema.dbml`, lalu deploy seperti rilis biasa. Jangan membuat atau mengedit migration langsung di VM produksi.

Yang tidak boleh dijalankan di produksi:
- Perintah reset Prisma yang menghapus data.
- `db push` (`migration-policy.md` baris 10).
- `db:migrate` (`prisma migrate dev`, `apps/api/package.json` baris 15). Script ini ditujukan untuk lokal (`migration-policy.md` baris 32).
- `db:seed` (`apps/api/prisma/seed.ts`). Seed membuat akun dengan password tetap (baris 175, 188, 201, 214). Nilainya tidak ditulis di dokumen ini. Larangan seed di produksi masih berupa usulan (`migration-policy.md` baris 34).

Catatan indeks: migration `20261014160000_workforce_normalized_name_uniqueness` dan `20261018120000_skills_normalized_name_uniqueness` menambah unique index `lower(name)`. Index ini menolak nama yang sama dengan perbedaan huruf besar atau kecil. Jika aplikasi dirollback ke versi yang tidak menangani error duplikat ini, perilakunya belum diverifikasi.

### E. Restore database (hanya dengan keputusan Tech Lead)

Belum ada di repo: skrip backup, skrip restore, format backup, dan lokasi penyimpanan. Dokumen versi lama memakai `psql` ke `localhost`, yang tidak akan terhubung (blocker 5). Garis besar yang harus diputuskan:

1. Hentikan `api` agar tidak ada penulisan baru.
2. Pastikan file backup bisa dibaca. Restore belum pernah diuji.
3. Restore ke database yang sudah dipastikan kosong atau baru dibuat. Cara pastinya belum ada di repo.
4. Terima bahwa data setelah backup hilang, termasuk sesi (`user_sessions`) dan alokasi yang dibuat setelah backup.
5. Jalankan Verifikasi akhir, lalu naikkan `api` kembali.

---

## Verifikasi akhir

- Liveness: `curl -f http://localhost:3000/api/v1/health/live` harus mengembalikan HTTP 200 dan `{ "status": "ok", ... }` (`apps/api/src/modules/health/health.routes.ts` baris 6-11).
- Readiness: `curl -f http://localhost:3000/api/v1/health/ready` harus mengembalikan HTTP 200 dengan `status: "ready"` dan `database: "connected"`. Jika DB tidak terhubung, endpoint mengembalikan 503 (baris 13-24).
- Port 3000 tetap dipublish di produksi (`docker-compose.yml` baris 27, tidak di-reset overlay), sehingga pengecekan dari host VM bisa dilakukan.
- Versi yang berjalan: bandingkan image ID dengan catatan langkah 3. Health endpoint tidak mengembalikan versi dan tidak memeriksa status migration.
- Web: service `web` dipublish di port 8080 host (`docker-compose.yml` baris 46). Buka halaman login dan pastikan SPA tampil. URL publik belum ada di repo.
- Login dan session: belum bisa diverifikasi sampai blocker 8 selesai.
- Status migration: belum ada di repo sebagai langkah verifikasi.

---

## Jika gagal

- **Build gagal**: jangan jalankan `up`. Container lama tetap berjalan. Lapor Tech Lead.
- **`up` gagal atau `api` tidak healthy**: lihat log dengan `docker compose -f docker-compose.yml -f docker-compose.prod.yml logs api`. Jangan menghapus volume. Lapor Tech Lead.
- **`/ready` mengembalikan 503**: periksa nilai `DATABASE_URL` dan status container `db`. Jangan restart DB tanpa keputusan Tech Lead.
- **HTTP 500 atau kolom dan index tidak cocok**: berhenti dan lapor Tech Lead. Pilihannya perbaikan maju atau restore (bagian D dan E).
- **Migration gagal di tengah**: jangan ulangi `migrate deploy` secara manual. Periksa tabel riwayat migration bawaan Prisma (`_prisma_migrations`). Cara membaca dan menandai status belum ada di repo. Keputusan ada di Tech Lead.
- **Data rusak**: berhenti dan lapor Tech Lead. Jangan menulis SQL perbaikan manual di produksi.
- Setiap langkah di bagian D dan E wajib keputusan Tech Lead.

---

## Belum diverifikasi

- Rollback belum pernah diuji di lingkungan mana pun. Tidak ada catatan uji di repo.
- Tidak ada git tag, sehingga target rollback belum ditentukan.
- Tidak ada image registry atau tag immutable. ADR-008 menargetkan GHCR, tetapi belum diimplementasikan.
- Apakah `prisma migrate deploy` (Prisma 7) membungkus tiap migration dalam transaksi. Ini menentukan keadaan database jika migration gagal di tengah.
- Perilaku `docker compose up` tanpa `--build` terhadap image lama.
- Dukungan tag `!reset` dan `!override` di file compose pada versi Docker Compose di VM.
- Apakah `npx prisma migrate deploy` gagal di container `api` (blocker 6). Dibaca dari Dockerfile, belum dijalankan.
- Perkiraan jeda layanan saat `up` (langkah 9) belum diukur.
- Skrip backup, skrip restore, dan format backup: belum ada di repo. Restore belum pernah diuji.
- Apakah aplikasi versi lama menangani error unique index `lower(name)` dengan benar.
- Isi TSD 12.3 dan 16.6: nomor dikutip dari dokumen repo, teks TSD tidak ada di repo.
- Cakupan aturan migrasi aditif, termasuk migration yang mengubah data. Belum disepakati (`migration-policy.md` baris 58).
- VM, folder deploy, nama project Compose, dan nama volume di VM (default Compose mengambil nama dari folder). Belum ada di repo.
- Cara mengakses DB dari VM tanpa publish port, dan kredensial untuk itu. Belum ada di repo.
- Verifikasi login setelah TLS dan `X-Forwarded-Proto` dipasang (blocker 8).
- Kebijakan retensi backup dan siapa yang berwenang restore. Keputusan Tech Lead.
