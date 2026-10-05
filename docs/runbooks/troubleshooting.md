# Operational Troubleshooting Guide

Panduan diagnosa dan penanganan insiden operasional Staffora.

---

## 1. Capacity Conflict & Allocation Rejections (HTTP 409)

- **Gejala**: User menerima respons error dengan code `CAPACITY_CONFLICT`.
- **Penyebab**: Alokasi yang diminta menyebabkan total alokasi karyawan melebihi 100% pada satu atau beberapa hari dalam rentang tanggal yang dipilih.
- **Diagnosa**: Periksa field `meta.conflictStartDate`, `meta.conflictEndDate`, dan `meta.remainingCapacity` pada respons error.
- **Solusi**: Sesuaikan persentase alokasi atau perkecil rentang tanggal alokasi agar tidak beririsan dengan alokasi aktif lainnya.

---

## 2. Row Lock Timeout pada Mutasi Alokasi

- **Gejala**: Request alokasi menghasilkan timeout atau HTTP 500 saat traffic tinggi.
- **Penyebab**: Dua request alokasi simultan mencoba mengunci baris employee yang sama (`SELECT ... FOR UPDATE` per TSD 10.4).
- **Diagnosa**: Periksa query lock di PostgreSQL:
  ```sql
  SELECT pid, query, state, age(clock_timestamp(), query_start)
  FROM pg_stat_activity
  WHERE query LIKE '%FOR UPDATE%';
  ```
- **Solusi**: PostgreSQL connection pooling dikonfigurasi dengan lock timeout yang wajar. Transaksi alokasi dirancang sangat cepat (hanya in-memory array sweep) sehingga lock held time berada di bawah 10 ms.

---

## 3. Session & CSRF Token Mismatch (HTTP 401 / 403)

- **Gejala**: Request form menghasilkan error 403 `Forbidden: Invalid CSRF Token`.
- **Penyebab**: Frontend tidak menyertakan header `X-CSRF-Token` pada request mutasi (POST, PUT, PATCH, DELETE), atau cookie `staffora.sid` kadaluarsa.
- **Solusi**:
  1. Pastikan frontend memanggil `GET /api/v1/auth/csrf-token` setelah login berhasil.
  2. Pastikan `credentials: "include"` disetel pada setiap `fetch` call agar cookie `staffora.sid` terkirim.
  3. Cek tabel `user_sessions` di database untuk memastikan session record aktif dan belum melewati masa timeout (8 jam).

---

## 4. Database Connection Issues

- **Gejala**: Endpoint `/api/v1/health/ready` menghasilkan status 503 `DOWN`.
- **Diagnosa**:
  ```bash
  docker compose logs db
  ```
  Pastikan database PostgreSQL aktif dan port 5432 dapat diakses dari container API.
