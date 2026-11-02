# Task Keamanan Lintas Modul (Sprint 1)

Task ini berasal dari review runbook deployment dan pemeriksaan kode. Tidak terkait satu story PRD, jadi perlu **penugasan Tech Lead** sebelum dikerjakan. Ini sesuai aturan `CLAUDE.md` bahwa agent hanya mengerjakan story yang ditugaskan.

Nilai secret, password, atau token **tidak ditulis** di file ini. Lokasi disebut dengan path dan baris.

Commit untuk task ini memakai tag `[QA-S1-SEC]`, mengikuti preseden `[QA-S1-DOC]`, karena tidak ada ID AC.

## Prioritas

| Prioritas | Task | Alasan |
| --- | --- | --- |
| P1 | S1-SEC-01, 02, 03 | Konfigurasi deploy membuka port dan memakai secret dari repo |
| P1 | S1-SEC-05, 06 | Kredensial seed ada di kode dan dokumen yang di-commit |
| P2 | S1-SEC-04 | Fallback `DATABASE_URL` diam-diam ke nilai lokal |
| P2 | S1-SEC-07 | TLS belum dikonfigurasi, cookie `Secure` tidak bertahan |
| P3 | S1-SEC-08 | Token CSRF tidak dibersihkan saat 403 |

---

## S1-SEC-01 — Wajibkan `SESSION_SECRET` di production
- Status: ready (perlu penugasan)
- Owner: QA & DevOps (Fikri), dengan Backend (Saiful & Jundy)
- Story/AC: — (lintas modul)
- Branch: QA-S1-SEC-session-secret-required
- Dependensi: —
- Kontrak: tidak ada
- Migration: tidak
- Boleh disentuh: `docker-compose.yml`, `docker-compose.prod.yml`, `.env.example`
- Di luar scope: mengubah cara sesi bekerja, mengubah `apps/api/src/common/auth/session.ts`
- Tes wajib: `docker compose -f docker-compose.yml -f docker-compose.prod.yml config` gagal bila `SESSION_SECRET` tidak diisi. API di production menolak start tanpa secret (sudah dijaga `apps/api/src/config/env.ts` baris 19–24).
- Gate: lint, typecheck, test, build
- Output: commit lokal
- Berhenti bila: keputusan apakah nilai cadangan lokal tetap ada di `docker-compose.yml` belum diambil Tech Lead

Konteks: `docker-compose.yml` baris 25 dan `docker-compose.prod.yml` baris 8 memakai nilai cadangan tertulis di file. Nilai itu lolos validasi panjang, sehingga production bisa start dengan secret yang ada di repo. Gunakan sintaks wajib `${SESSION_SECRET:?...}` di overlay production.

---

## S1-SEC-02 — Tutup port API di production
- Status: ready (perlu penugasan)
- Owner: QA & DevOps (Fikri)
- Story/AC: — (lintas modul)
- Branch: QA-S1-SEC-api-port-prod
- Dependensi: —
- Kontrak: tidak ada
- Migration: tidak
- Boleh disentuh: `docker-compose.prod.yml`
- Di luar scope: mengubah port di `docker-compose.yml` untuk pengembangan lokal
- Tes wajib: `docker compose -f docker-compose.yml -f docker-compose.prod.yml config` tidak memuat port publik untuk service `api`. Nginx di `web` tetap bisa mencapai `api:3000` lewat jaringan internal.
- Gate: lint, typecheck, test, build
- Output: commit lokal
- Berhenti bila: `web` ternyata tidak bisa mencapai `api` setelah port ditutup

Konteks: `docker-compose.yml` baris 26–27 mem-publish `3000:3000`. Overlay production tidak menimpanya, jadi API bisa diakses langsung lewat HTTP tanpa Nginx.

---

## S1-SEC-03 — Pindahkan kredensial database dari repo
- Status: ready (perlu penugasan)
- Owner: QA & DevOps (Fikri)
- Story/AC: — (lintas modul)
- Branch: QA-S1-SEC-db-credentials
- Dependensi: S1-SEC-01 (agar pola variabel konsisten)
- Kontrak: tidak ada
- Migration: tidak
- Boleh disentuh: `docker-compose.yml`, `docker-compose.prod.yml`, `.env.example`, `apps/api/.env.example`, `apps/api/.env.test.example`, `.github/workflows/ci.yml` (bagian variabel koneksi dan service Postgres), `docs/development/local-setup.md` (bagian yang menyebut kredensial lokal)
- Di luar scope: mengganti password di database yang sudah berjalan. Itu keputusan operasional (lihat "Keputusan terbuka").
- Tes wajib: `POSTGRES_PASSWORD` dan `DATABASE_URL` di overlay production wajib diisi dari variabel lingkungan. Pencarian `grep` untuk nilai literal di compose tidak menemukan apa pun.
- Gate: lint, typecheck, test, build
- Output: commit lokal
- Berhenti bila: nama variabel untuk production belum disepakati

Konteks: `docker-compose.yml` baris 6 (`POSTGRES_PASSWORD`) dan baris 24 (`DATABASE_URL`) menuliskan password lokal secara literal. Overlay production tidak menggantinya. Nilai ini ada di riwayat git, jadi harus dianggap sudah terbuka. Staging dan production wajib memakai kredensial baru. `.github/workflows/ci.yml` juga memuat nilai untuk `POSTGRES_PASSWORD`, `DATABASE_URL`, dan `SESSION_SECRET` (baris 29, 40, dan 41 saat ini). `apps/api/.env.example` dan `apps/api/.env.test.example` memuat `DATABASE_URL` dengan password lokal.

---

## S1-SEC-04 — Hentikan fallback `DATABASE_URL` yang diam-diam
- Status: ready (perlu penugasan)
- Owner: Backend (Saiful & Jundy)
- Story/AC: — (lintas modul)
- Branch: BE-S1-SEC-database-url-config
- Dependensi: —
- Kontrak: tidak ada
- Migration: tidak
- Boleh disentuh: `apps/api/src/common/database/prisma.ts`, `apps/api/src/config/env.ts`, `apps/api/tests/` (tes baru)
- Di luar scope: mengubah skema atau query
- Tes wajib: start tanpa `DATABASE_URL` gagal dengan pesan jelas. Tes baru di `apps/api/tests/`.
- Gate: lint, typecheck, test, build
- Output: commit lokal
- Berhenti bila: tes yang ada bergantung pada fallback. Laporkan dulu.

Konteks: `apps/api/src/common/database/prisma.ts` baris 9–12 memakai nilai cadangan lokal bila `DATABASE_URL` kosong, dan membaca `process.env` langsung. `CLAUDE.md` melarang pembacaan `process.env` di luar konfigurasi terpusat (`apps/api/src/config/env.ts`).

---

## S1-SEC-05 — Hentikan cetak dan hardcode password seed
- Status: blocked (Tech Lead: pilih sumber password seed: variabel lingkungan atau acak)
- Owner: Database (Saiful, Jundy, Arya)
- Story/AC: — (lintas modul)
- Branch: DB-S1-SEC-seed-credentials
- Dependensi: keputusan Tech Lead
- Kontrak: tidak ada
- Migration: tidak
- Boleh disentuh: `apps/api/prisma/seed.ts`
- Di luar scope: mengubah data seed selain password
- Tes wajib: output `npm run db:seed -w @staffora/api` tidak memuat password. Seed menolak jalan bila `NODE_ENV=production`.
- Gate: lint, typecheck, test, build
- Output: commit lokal
- Berhenti bila: keputusan belum ada

Konteks: `apps/api/prisma/seed.ts` menuliskan password literal di baris 175, 188, 201, dan 214, lalu mencetaknya ke console di baris 266–272. File ini di-commit. **Anggap password seed sudah terbuka.** Pastikan tidak dipakai di staging atau production.

---

## S1-SEC-06 — Hapus kredensial seed dari dokumen
- Status: ready (perlu penugasan)
- Owner: QA & DevOps (Fikri)
- Story/AC: — (lintas modul)
- Branch: QA-S1-SEC-docs-remove-seed-credentials
- Dependensi: S1-SEC-05 (agar dokumen menunjuk cara yang benar)
- Kontrak: tidak ada
- Migration: tidak
- Boleh disentuh: `README.md` (tabel akun pengujian), `docs/development/local-setup.md` (bagian kredensial seed), `docs/ui-specs/app-shell/qa/round-2/round-2.md` (baris yang memuat password seed)
- Di luar scope: file kode
- Tes wajib: `grep` untuk nilai password seed di `docs/` tidak menemukan apa pun
- Gate: lint, typecheck, test, build
- Output: commit lokal
- Berhenti bila: —

Konteks: `docs/development/local-setup.md` baris 130 menyebut password seed. Dokumen ini harus menunjuk ke cara mendapatkan kredensial lokal, bukan menuliskannya.

---

## S1-SEC-07 — Konfigurasi TLS dan proxy
- Status: blocked (Tech Lead dan DevOps: keputusan cara TLS berakhir)
- Owner: QA & DevOps (Fikri), keputusan Tech Lead
- Story/AC: — (lintas modul)
- Branch: QA-S1-SEC-tls-termination
- Dependensi: keputusan Tech Lead. Perubahan arsitektur butuh ADR baru atau revisi ADR-007.
- Kontrak: tidak ada
- Migration: tidak
- Boleh disentuh: `apps/web/nginx.conf`, `apps/api/src/app.ts` (blok `trust proxy` saja), `docker-compose.prod.yml`
- Di luar scope: mengubah logika sesi
- Tes wajib: login lewat HTTPS mengembalikan `Set-Cookie` dengan `Secure`, dan sesi bertahan di request berikutnya. Request HTTP dialihkan ke HTTPS.
- Gate: lint, typecheck, test, build
- Output: commit lokal dan ADR
- Berhenti bila: sertifikat atau cara penerbitannya belum ada

Konteks: `apps/web/nginx.conf` baris 2 hanya `listen 80`. Nginx tidak meneruskan `X-Forwarded-Proto`. `apps/api/src/app.ts` baris 53–55 mengaktifkan `trust proxy` hanya di production. Dengan `NODE_ENV=production`, cookie diberi `Secure` (`session.ts` baris 49), sehingga login lewat HTTP tidak bertahan.

---

## S1-SEC-08 — Bersihkan cache CSRF saat 403
- Status: ready (perlu penugasan)
- Owner: Frontend (Wahyu & Nabil)
- Story/AC: — (lintas modul)
- Branch: FE-S1-SEC-csrf-cache-on-403
- Dependensi: —
- Kontrak: tidak ada
- Migration: tidak
- Boleh disentuh: `apps/web/src/api/client.ts`, `apps/web/tests/` (tes baru)
- Di luar scope: mengubah perilaku 401
- Tes wajib: setelah sesi habis, POST yang gagal 403 membersihkan cache token, dan request berikutnya mengambil token baru. Tes baru di `apps/web/tests/`.
- Gate: lint, typecheck, test, build
- Output: commit lokal
- Berhenti bila: —

Konteks: `apps/web/src/api/client.ts` baris 118–120 hanya menghapus cache CSRF pada 401. Saat sesi habis, POST bisa terus gagal 403 sampai halaman dimuat ulang.

---

## Keputusan terbuka (bukan task kode)

1. **Rotasi kredensial.** Password database dan password seed yang ada di repo perlu diganti untuk staging dan production. Keputusan siapa yang menjalankan dan kapan: Tech Lead.
2. **Nilai cadangan lokal.** Apakah `docker-compose.yml` tetap memuat nilai lokal untuk pengembangan. Ini memengaruhi S1-SEC-01 dan S1-SEC-03.
3. **Rate limit di memori.** `apps/api/src/common/auth/rate-limiter.ts` menyimpan hitungan per proses. Aman untuk satu VM (ADR-007). Jika jumlah instance bertambah, perlu penyimpanan bersama. Keputusan terima risiko atau pindahkan: Tech Lead.
4. **Dokumen yang terbuka tapi tidak di-commit.** `docs/audits/` berisi temuan internal dan belum ter-commit. Keputusan apakah folder ini masuk repo: Tech Lead.

## Keputusan Tech Lead (dicatat)

- **Aturan `SESSION_SECRET` diturunkan.** Tanggal 2026-11-02, Tech Lead (Arya Isnaidi) menyetujui aturan minimal 8 karakter dengan satu huruf kapital dan satu karakter khusus, menggantikan minimal 32 karakter. Aturan ini ada di `apps/api/src/config/env.ts`. Risiko: secret lebih pendek dan lebih mudah ditebak daripada 32 karakter. Ini ikut menyentuh temuan DK-1 di `docs/audits/`.
- **Fallback production belum diubah.** Nilai cadangan di `docker-compose.prod.yml` tidak memenuhi aturan baru. Jika `SESSION_SECRET` tidak diset di production, API gagal start. Perbaikan nilai cadangan tetap masuk S1-SEC-01.
- **Pengecualian scope branch `QA-S1-DOC-docs-restructure`** dicatat di `docs/tasks/cross-cutting/scope-exception-qa-s1-doc.md`.
