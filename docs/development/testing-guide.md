# Testing Guide & Strategy

Panduan pengujian otomatis untuk Staffora berdasarkan TSD Section 15.

---

## 1. Running Tests

```bash
# Menjalankan seluruh test suite (Backend & Frontend)
npm test

# Menjalankan test backend saja
npm test -w @staffora/api

# Menjalankan test frontend saja
npm test -w @staffora/web
```

---

## 2. 15 Mandatory Capacity Scenarios (TSD 15.3)

Modul kalkulasi kapasitas (`apps/api/src/modules/capacity/capacity.service.ts`) wajib lolos 15 skenario pengujian kapasitas tanpa kompromi (diuji di `apps/api/tests/capacity.test.ts`):

1. **No existing allocation**: Resource tanpa alokasi memiliki remaining capacity 100%.
2. **Non-overlapping allocation**: Alokasi di masa depan/lampau yang tidak beririsan tidak mengurangi kapasitas rentang target.
3. **Partial overlap**: Alokasi yang memotong sebagian rentang dihitung hanya pada tanggal irisan.
4. **Full overlap**: Alokasi yang menutupi seluruh rentang target dihitung secara penuh.
5. **Sequential non-concurrent allocations**: Alokasi berurutan (misal: 1–15 Jan 50% dan 16–31 Jan 50%) menghasilkan peak 50%, **BUKAN 100%**.
6. **Same-day inclusive boundary**: Start date dan end date yang bersentuhan di hari yang sama dihitung beririsan secara inklusif.
7. **Allocation exactly 100%**: Diperbolehkan dan status resource menjadi Fully Allocated (remaining capacity 0%).
8. **Allocation above 100%**: Wajib ditolak dengan `CAPACITY_CONFLICT` (HTTP 409).
9. **Multiple concurrent allocations**: Multi proyek pada waktu bersamaan dijumlahkan secara akurat per tanggal.
10. **Edit excludes current allocation**: Saat mengupdate alokasi, alokasi yang sedang diedit dikecualikan dari kalkulasi eksisting.
11. **Cancelled allocation**: Alokasi berstatus CANCELLED tidak mengonsumsi kapasitas.
12. **Historical ended allocation**: Alokasi yang sudah selesai (ENDED) tetap dihitung jika melihat rentang historis.
13. **Inactive employee**: Karyawan non-aktif tidak dapat dialokasikan pada proyek baru.
14. **Allocation outside project period**: Tanggal alokasi di luar rentang tanggal proyek wajib ditolak.
15. **Concurrent save attempts**: Mutasi alokasi untuk karyawan yang sama diserialisasi dengan `SELECT ... FOR UPDATE` agar tidak terjadi race condition yang melampaui 100%.

---

## 3. Mandatory Authorization Matrix (TSD 15.4)

Setiap capability API diuji terhadap:
- Role yang diizinkan (Allowed role).
- Role yang dilarang (Disallowed role) -> HTTP 403.
- Project Manager pada proyek miliknya (Allowed).
- Project Manager pada proyek milik PM lain (Disallowed -> HTTP 403).
- Employee melihat data miliknya sendiri (Allowed).
- Employee mencoba mengakses data employee lain (Disallowed -> HTTP 403).
- Akun berstatus `isActive: false` dengan session lama (Disallowed -> HTTP 401/403).
- Direct API request tanpa melalui UI (Tetap terproteksi di backend).
