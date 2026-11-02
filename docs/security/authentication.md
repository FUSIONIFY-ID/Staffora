# Autentikasi dan Sesi

Dokumen ini menjelaskan bagaimana Staffora mengautentikasi user, mengelola sesi, dan melindungi request yang mengubah data. Sumbernya ada di `apps/api/src/common/auth/`.

Sumber aturan: TSD §8.1 sampai §8.5 dan ADR-006. Teks TSD tidak ada di repo. Klaim yang bersumber dari TSD ditandai, dan nomor bagian dikutip dari dokumen yang dibaca saat menulis.

## Sesi

| Aspek | Nilai | Sumber |
| --- | --- | --- |
| Nama cookie | `staffora.sid` | `session.ts` |
| Atribut cookie | `HttpOnly`, `SameSite=Lax`, `Path=/` | `session.ts` |
| `Secure` | Aktif saat `NODE_ENV=production` | `session.ts` |
| Timeout inaktivitas | 8 jam, di-refresh setiap request (`rolling: true`) | `session.ts` |
| Penyimpanan | Tabel `user_sessions` di PostgreSQL, lewat `connect-pg-simple` | `session.ts`, migrasi init |
| `saveUninitialized` | `false`. Sesi anonim tidak disimpan kecuali memang diisi | `session.ts` |

Catatan dari kode: `Secure` mengikuti `NODE_ENV` saja. Staging memakai `NODE_ENV=production`, jadi staging juga memakai cookie `Secure` dan membutuhkan HTTPS di depan.

Pool PostgreSQL untuk sesi dibuat satu kali per connection string. Error pada koneksi idle dicatat dan tidak mematikan proses (`session.ts`, baris 11–31).

## Login dan logout

- Saat login berhasil, ID sesi di-regenerate lebih dulu untuk mencegah session fixation (TSD §8.1, dikutip di `session.ts`). Lalu `userId` dan token CSRF disimpan di sesi baru (`establishSession`).
- Logout menghancurkan sesi di server dan menghapus cookie (`destroySession`, `clearSessionCookie`). Pemanggilan dari alur logout ada di modul identity.
- Setiap request terautentikasi memuat user aktif, role, dan employee linkage dari database. User nonaktif ditolak walaupun sesinya masih ada (TSD §8.1). Implementasinya ada di `identity-loader.ts`, lihat [dokumen identity](../architecture/modules/identity.md).

## CSRF

- Token: 32 byte acak, dikodekan hex (`csrf.ts`, baris 9–11).
- Disimpan di sesi. Dikirim klien lewat header `X-CSRF-Token`.
- Diperiksa untuk semua method selain `GET`, `HEAD`, dan `OPTIONS`. Termasuk `POST /auth/login`, karena token diambil dari `GET /api/v1/auth/csrf-token` sebelum login (`csrf.ts`, baris 5–6).
- Perbandingan memakai `timingSafeEqual` (`csrf.ts`, baris 13–20).
- Token yang tidak valid atau tidak ada menghasilkan 403 `FORBIDDEN` dengan pesan `Invalid or missing CSRF token.`

## Password

- Hash: bcryptjs dengan cost 12 (`password.ts`, baris 4). Sesuai TSD §8.2.
- Panjang minimum awal 12 karakter (TSD §8.2).
- Saat akun tidak ditemukan, verifikasi tetap menjalankan bcrypt terhadap hash dummy dengan cost yang sama. Tujuannya agar waktu respons tidak bisa dipakai untuk menebak email yang terdaftar (`password.ts`, baris 12–24).

## Rate limit

| Batas | Nilai | Kunci | Sumber |
| --- | --- | --- | --- |
| Login | 5 percobaan per 15 menit | IP dan email yang dinormalisasi | `rate-limiter.ts`, TSD §8.5 |
| Request terautentikasi | 300 per menit | ID user | `rate-limiter.ts` |
| Request anonim | 100 per menit | IP | `rate-limiter.ts` |

Batas ini disimpan di memori proses. Di satu VM untuk MVP (ADR-007) ini cukup. Jika aplikasi dijalankan di lebih dari satu instance, setiap instance punya hitungan sendiri, dan batas efektifnya menjadi kelipatan jumlah instance. Keputusan untuk memindahkan batas ke penyimpanan bersama belum dibuat.

## CORS dan header keamanan

- CORS allowlist: `http://localhost:5173`, `http://localhost:3000`, dan nilai `CORS_ORIGIN` bila diisi. `credentials: true` (`app.ts`, baris 88–106). Sumber: TSD §8.3.
- Helmet aktif. Content Security Policy hanya aktif di production (`app.ts`, baris 79–85).
- Body JSON dibatasi 1 MB (`app.ts`, baris 109).
- `trust proxy` hanya aktif di production, dengan satu hop, karena Nginx menerminasi TLS (ADR-007, `app.ts`, baris 51–55).

## Otorisasi

Otorisasi per route memakai `requireAuth` dan `requireRole`. Matriks lengkapnya ada di [rbac-matrix](rbac-matrix.md).

Pembatasan per data, misalnya EMPLOYEE hanya membaca dirinya sendiri atau PROJECT_MANAGER hanya mengubah proyeknya, ada di `policy.ts` dan dicek di service. Matriks tidak menggambarkan bagian ini.

## Pengujian

- TSD §15.4 mewajibkan setiap capability yang dilindungi diuji terhadap:
  - peran yang diizinkan
  - EMPLOYEE yang mengakses data karyawan lain
  - user nonaktif yang masih punya sesi
  - request langsung ke API tanpa navigasi frontend
- Tes otorisasi ada di `apps/api/tests/authorization.test.ts`. Isinya belum dicek ulang untuk setiap baris matriks.

## Belum diverifikasi

- Isi `identity-loader.ts` dan alur logout dibaca oleh dokumen identity, tidak dibaca ulang di sini.
- Kesesuaian dengan TSD §8.1 dan §8.4 secara penuh belum diverifikasi, karena teks TSD tidak ada di repo.
