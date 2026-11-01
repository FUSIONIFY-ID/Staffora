# Runbook: Backup dan Restore Database PostgreSQL

- **Pemilik**: QA & DevOps (Fikri) untuk pelaksanaan backup dan pipeline. Keputusan restore ada pada Tech Lead (Arya Isnaidi), sesuai `docs/runbooks/rollback.md` baris 3 dan bagian E.
- **Kapan dipakai**: (1) sebelum migrasi produksi, sesuai langkah 2 di `docs/runbooks/deployment.md`; (2) saat mitigasi rilis melibatkan data, sesuai `docs/runbooks/rollback.md` bagian E; (3) backup harian rutin sesuai kebijakan di bagian "Kebijakan dan kondisi repo", yang belum ada implementasinya.
- **Risiko**: Restore menghilangkan data yang masuk setelah titik backup, termasuk sesi (`user_sessions`) dan alokasi yang dibuat setelah backup (`docs/runbooks/rollback.md` baris 112). Menghapus volume `staffora_pgdata` menghilangkan seluruh data database (`docs/runbooks/rollback.md` baris 73, `docker-compose.yml` baris 11). File backup memuat data sensitif: hash password (`docs/database/erd.md` baris 14) dan isi sesi (`docs/database/erd.md` baris 24). Backup yang belum pernah di-restore belum bisa dianggap cadangan yang sah.
- **Terakhir diuji**: Belum pernah diuji. Repo tidak memuat catatan backup atau restore yang berhasil (per 2026-11-01).

> Status dokumen: runbook ini disusun dengan membaca kode dan konfigurasi. Tidak ada perintah backup atau restore yang dijalankan. Langkah yang ditandai "belum ada di repo" atau "usulan" belum sah. Prosedur restore harus diuji di lingkungan staging sebelum dianggap sah.

## Kebijakan dan kondisi repo

### Kebijakan yang diminta

Kebijakan berikut diminta untuk Staffora. Di repo, implementasinya belum ada.

- Backup logical PostgreSQL dilakukan setiap hari.
- Retensi: 7 backup harian dan 4 backup mingguan.

Tafsir yang belum disepakati: "7 harian" berarti 7 backup harian terakhir, dan "4 mingguan" berarti 4 backup mingguan terakhir. Waktu backup harian dan zona waktunya belum ditetapkan. Keputusan ada pada Tech Lead.

Nomor bagian TSD untuk kebijakan ini tidak dikutip di sini, karena tidak ditemukan di dokumen repo mana pun. Teks TSD tidak ada di repo.

### Hasil pencarian mekanisme backup di repo

Pencarian dilakukan di `.github/workflows/`, `docker-compose*.yml`, `docs/`, dan `apps/api/` dengan kata kunci `pg_dump`, `pg_restore`, `backup`, `retention`/`retensi`, dan `cron`/`schedule`.

| Lokasi | Hasil |
|---|---|
| `.github/workflows/` (`ci.yml`, `deploy-staging.yml`, `deploy-production.yml`) | Tidak ada backup, retensi, atau cron. Tidak ada trigger `schedule:` (`ci.yml` baris 3-7, `deploy-staging.yml` baris 3-6, `deploy-production.yml` baris 3-7). Deploy hanya membangun image (`deploy-staging.yml` baris 21-22, `deploy-production.yml` baris 22-23). CI memakai service postgres sekali pakai (`ci.yml` baris 24-32). |
| `docker-compose.yml`, `docker-compose.prod.yml`, `docker-compose.dev.yml` | Tidak ada service atau container backup. Hanya named volume `staffora_pgdata` (`docker-compose.yml` baris 11 dan 57). Overlay produksi mereset port `db` (`docker-compose.prod.yml` baris 4). |
| `apps/api/` | Tidak ada kode, skrip, atau script backup dan restore. Script database di `apps/api/package.json` baris 14-17 hanya `db:generate`, `db:migrate`, `db:migrate:deploy`, dan `db:seed`. Hasil "Retention Rationale" di `apps/api/src/common/auth/rbac.ts` baris 52 dan `apps/api/src/common/auth/policy.ts` baris 99 tidak terkait backup. |
| `docs/` | `pg_dump` hanya disebut sebagai rencana, bukan implementasi: `docs/architecture/decisions/adr-007-deployment-topology.md` baris 22. `docs/architecture/decisions/adr-010-lean-architecture-no-queue.md` baris 22 hanya menyebut database tunggal memudahkan backup. `docs/runbooks/deployment.md` baris 74, 88-92, dan 148 menyatakan langkah backup belum ada di repo. `docs/runbooks/rollback.md` baris 33, 107-112, 151, dan 158 menyatakan hal serupa. |

Catatan: di commit terakhir (HEAD), `docs/runbooks/deployment.md` baris 41-44 dan `docs/runbooks/rollback.md` baris 32-33 memuat perintah backup dan restore yang memakai `localhost`. Perubahan yang belum di-commit menghapus perintah itu. Perintah tersebut tidak dipakai di sini, karena port 5432 di-reset di overlay produksi (`docker-compose.prod.yml` baris 4) dan `localhost` tidak terjangkau dari konfigurasi repo.

---

## Prasyarat

- Akses ke VM produksi, folder deployment, dan host tempat backup disimpan: belum ada di repo.
- Container `db` berjalan dan healthy. Healthcheck memakai `pg_isready` (`docker-compose.yml` baris 12-16). Status dicek dengan `docker compose ps`, seperti di `docs/development/local-setup.md` baris 71.
- Nama variabel (nilai tidak ditulis di sini): `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` (`docker-compose.yml` baris 5-7), dan `DATABASE_URL` untuk aplikasi (`docker-compose.yml` baris 24). Nilai di repo adalah nilai lokal dan tidak berlaku untuk produksi (`docs/runbooks/deployment.md` bagian 1.4). Kredensial produksi: belum ada di repo.
- Lokasi penyimpanan backup, enkripsi, dan hak akses: belum ada di repo.
- `pg_dump` dan `pg_restore` tersedia di container `db` (image `postgres:18`, `docker-compose.yml` baris 3): belum diverifikasi.
- Untuk restore: keputusan tertulis dari Tech Lead (`docs/runbooks/rollback.md` bagian E, baris 105) dan lingkungan uji terpisah. Di repo tidak ada overlay staging sendiri (`docs/runbooks/deployment.md` bagian 1.3).

## Langkah

### A. Backup harian (belum ada di repo)

Status tiap langkah di repo:

| # | Langkah | Status di repo |
|---|---|---|
| 1 | Buat dump logical PostgreSQL dari container `db`. Metode `pg_dump` disebut di `docs/architecture/decisions/adr-007-deployment-topology.md` baris 22. | Belum ada di repo. Port 5432 tidak dipublish di overlay produksi, jadi dump perlu dijalankan dari dalam container. |
| 2 | Beri nama file dengan tanggal dan waktu, dan tetapkan format. | Belum ada di repo. |
| 3 | Simpan file di lokasi terpisah dari VM. | Belum ada di repo. |
| 4 | Jalankan setiap hari. | Belum ada di repo. Tidak ada trigger `schedule:` dan tidak ada cron. |
| 5 | Terapkan retensi 7 harian dan 4 mingguan. | Belum ada di repo. |
| 6 | Cek file: ada dan tidak kosong. | Usulan dari `docs/runbooks/deployment.md` baris 92. Belum disetujui. |
| 7 | Catat hasil dan kegagalan, lalu beri tahu Tech Lead. | Belum ada di repo. |

### B. Restore database (usulan, belum diuji)

Prosedur ini hanya dijalankan setelah keputusan Tech Lead. Restore dilakukan ke database baru, bukan menimpa `staffora` yang sedang dipakai (`docs/runbooks/rollback.md` baris 111). Nilai `<file-backup>` dan `<db-restore>` adalah placeholder.

0. Sebelum restore, buat backup dari keadaan sekarang. Metodenya belum ada di repo (lihat bagian A).
1. Hentikan `api` agar tidak ada penulisan baru:

   ```
   docker compose -f docker-compose.yml -f docker-compose.prod.yml stop api
   ```

2. Pastikan file backup bisa dibaca. Caranya belum ada di repo. Usulan: periksa daftar isi arsip tanpa melakukan restore.
3. Buat database kosong sebagai tujuan:

   ```
   docker compose -f docker-compose.yml -f docker-compose.prod.yml exec db createdb -U staffora <db-restore>
   ```

4. Restore ke database tujuan:

   ```
   docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T db pg_restore -U staffora -d <db-restore> --no-owner < <file-backup>
   ```

   Perintah ini mengasumsikan format custom. Format backup belum ditetapkan di repo.
5. Jalankan Verifikasi akhir terhadap database tujuan. Cara menunjuk `api` ke database itu belum ada di repo (lihat Belum diverifikasi).
6. Pindahkan database aktif hanya dengan keputusan Tech Lead. Cara mengubah `DATABASE_URL` belum ada di repo, karena nilainya tertulis langsung di `docker-compose.yml` baris 24.
7. Jalankan kembali `api`:

   ```
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d api
   ```

8. Catat data yang hilang sejak backup, termasuk sesi dan alokasi (`docs/runbooks/rollback.md` baris 112).

---

## Verifikasi akhir

- Backup (usulan, belum diuji): file ada, ukurannya lebih dari nol, dan daftar isinya bisa dibaca. Bukti yang sebenarnya hanya datang dari restore uji.
- Database tujuan restore: tabel `_prisma_migrations` ada dan berisi baris (`docs/runbooks/rollback.md` baris 135). Cara membandingkannya dengan folder migrations di repo belum ada di repo.
- Setelah `api` naik: `GET /api/v1/health/live` mengembalikan HTTP 200 dengan `status` `ok` (`apps/api/src/modules/health/health.routes.ts` baris 6-11, dipasang di `apps/api/src/app.ts` baris 130).
- `GET /api/v1/health/ready` mengembalikan HTTP 200 dengan `status` `ready` dan `database` `connected` (`health.routes.ts` baris 13-26). Endpoint ini hanya menjalankan `SELECT 1`. Ia tidak membuktikan data utuh atau migrasi sudah sesuai.
- Pemeriksaan data, misalnya jumlah baris tabel kunci dibandingkan catatan sebelum backup: belum ada di repo.

## Jika gagal

- Backup gagal atau belum tersedia sebelum migrasi: jangan lanjut ke migrasi (`docs/runbooks/deployment.md` baris 138).
- File backup kosong atau tidak bisa dibaca: jangan restore dari file itu. Simpan backup terakhir yang valid dan lapor Tech Lead.
- Restore ke database tujuan gagal: biarkan `staffora` yang aktif tidak tersentuh. Menghapus database tujuan hanya dengan persetujuan Tech Lead, karena tindakan ini tidak bisa dibatalkan.
- `/api/v1/health/ready` mengembalikan 503 setelah `api` naik: periksa `DATABASE_URL` (`docker-compose.yml` baris 24) dan container `db`. Jangan restart `db` tanpa keputusan Tech Lead (`docs/runbooks/rollback.md` baris 133).
- Data hasil restore tidak sesuai: berhenti dan lapor Tech Lead. Jangan menulis SQL perbaikan manual di produksi (`docs/runbooks/rollback.md` baris 93 dan 136).
- Jangan menghapus volume `staffora_pgdata`, termasuk lewat perintah compose yang ikut menghapus volume (`docs/runbooks/rollback.md` baris 73).
- Jika kebijakan atau langkah tidak jelas, berhenti dan hubungi Tech Lead Arya Isnaidi.

---

## Belum diverifikasi

- Mekanisme backup harian, retensi, dan penjadwalannya: belum ada di repo. Tidak ada skrip, workflow, service, atau cron.
- Format backup, nama file, dan perintah `pg_dump` serta `pg_restore` yang persis: belum ada di repo. `pg_restore` dan `createdb` tidak muncul di repo, jadi keduanya hanya dipakai sebagai usulan.
- Ketersediaan `pg_dump` dan `pg_restore` di image `postgres:18`. Apakah koneksi lokal di dalam container meminta password juga belum diverifikasi. Repo tidak mengatur `POSTGRES_HOST_AUTH_METHOD`.
- Flag `--no-owner` dan format custom pada restore: usulan, belum diuji.
- Lokasi penyimpanan, enkripsi, hak akses, dan salinan di luar VM: belum ada di repo.
- Kredensial dan akses ke VM serta database produksi: belum ada di repo.
- Nama volume di VM. Compose biasanya menambahkan nama project di depan nama volume, tetapi nama project di VM belum ada di repo.
- Cara menunjuk `api` ke database hasil restore, dan cara menukar database aktif: belum ada di repo.
- Restore belum pernah diuji di lingkungan mana pun. Repo tidak memuat catatan uji.
- Ukuran backup, lama dump, dan lama restore: belum diukur.
- Apakah `prisma migrate deploy` membungkus setiap migrasi dalam transaksi. Ini menentukan keadaan database jika migrasi gagal setelah backup (`docs/runbooks/rollback.md` baris 146).
- Nomor bagian TSD untuk kebijakan backup: tidak ditemukan di dokumen repo. Teks TSD tidak ada di repo.
