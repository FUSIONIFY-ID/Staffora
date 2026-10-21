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
  1. Pastikan frontend memanggil `GET /api/v1/auth/csrf-token` **sebelum login** (login juga wajib membawa `X-CSRF-Token`) dan memakai `data.csrfToken` baru yang dikembalikan login setelahnya. Di tes backend, gunakan helper `postLogin` dari `apps/api/tests/support/auth-login.ts`.
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

---

## 5. Migrasi Gagal Karena Duplikat Case-Insensitive (P3018)

- **Gejala**: `prisma migrate deploy` berhenti dengan `P3018` dan pesan
  `Cannot add the case-insensitive unique index on departments.name. Merge or rename these duplicates first: it ops (2 rows)`,
  atau pesan yang sama untuk `skills.name`.
  Deploy berikutnya ditolak dengan `P3009` karena migrasi sebelumnya tercatat gagal
  (`finished_at` kosong di `_prisma_migrations`).
- **Penyebab**: Migrasi `20261014160000_workforce_normalized_name_uniqueness` menambahkan unique index
  pada `lower(name)` untuk `departments` dan `job_roles`, dan
  `20261018120000_skills_normalized_name_uniqueness` menambahkan yang sama untuk `skills`.
  PostgreSQL menolaknya bila sudah ada dua baris yang namanya sama setelah di-lowercase. Ini kondisi
  data, bukan bug kode, dan hanya muncul di lingkungan yang sempat menerima duplikat sebelum
  constraint ada.
- **Diagnosa**: cari duplikatnya lebih dulu, read-only.
  ```sql
  SELECT lower(name) AS normalized, count(*) AS rows, array_agg(name ORDER BY name) AS names
  FROM departments GROUP BY lower(name) HAVING count(*) > 1;

  SELECT lower(name) AS normalized, count(*) AS rows, array_agg(name ORDER BY name) AS names
  FROM job_roles GROUP BY lower(name) HAVING count(*) > 1;

  SELECT lower(name) AS normalized, count(*) AS rows, array_agg(name ORDER BY name) AS names
  FROM skills GROUP BY lower(name) HAVING count(*) > 1;
  ```
- **Solusi**: gabungkan tiap grup menjadi satu baris, pindahkan referensinya lebih dulu, baru jalankan
  ulang migrasi. Referensi foreign key yang menunjuk ketiga tabel: `employees.department_id`,
  `employees.job_role_id`, `allocations.job_role_id`, `staffing_requirements.job_role_id`,
  `employee_skills.skill_id`, `staffing_requirement_skills.skill_id`.

  Tentukan dulu baris mana yang dipertahankan dan mana yang dibuang, satu pasang per grup. Contoh di
  bawah mempertahankan baris terlama (`created_at` paling awal, lalu `id` sebagai tie-break):

  ```sql
  WITH ranked AS (
    SELECT id, name, row_number() OVER (PARTITION BY lower(name) ORDER BY created_at, id) AS rn
    FROM departments
  )
  SELECT (array_agg(id ORDER BY rn))[1] AS keep_id, (array_agg(id ORDER BY rn))[2] AS drop_id
  FROM ranked WHERE rn <= 2 GROUP BY lower(name) HAVING count(*) > 1;
  ```

  Ulangi dengan `FROM job_roles` dan `FROM skills` untuk tabel lainnya. Jalankan blok berikut satu kali
  per pasangan, dengan `:keep_id` dan `:drop_id` diganti hasil query di atas:

  ```sql
  BEGIN;

  -- Pindahkan referensi dari baris yang dibuang ke baris yang dipertahankan.
  UPDATE employees SET department_id = :keep_id WHERE department_id = :drop_id;
  UPDATE employees SET job_role_id   = :keep_id WHERE job_role_id   = :drop_id;
  UPDATE allocations SET job_role_id = :keep_id WHERE job_role_id  = :drop_id;
  UPDATE staffing_requirements SET job_role_id = :keep_id WHERE job_role_id = :drop_id;

  -- Baru hapus baris yang dibuang.
  DELETE FROM departments WHERE id = :drop_id;
  DELETE FROM job_roles   WHERE id = :drop_id;

  COMMIT;
  ```

  Untuk `skills`, penggabungannya berbeda karena satu karyawan tidak boleh punya skill yang sama dua
  kali (`employee_skills` unik pada `employee_id, skill_id`). Buang pasangan yang bentrok lebih dulu,
  baru pindahkan sisanya:

  ```sql
  BEGIN;

  -- Baris yang akan bentrok setelah referensi dipindah: karyawan yang punya
  -- kedua skill sekaligus. Simpan yang lebih tinggi proficiency-nya.
  DELETE FROM employee_skills AS duplicate
  USING employee_skills AS kept
  WHERE duplicate.skill_id = :drop_id
    AND kept.skill_id = :keep_id
    AND kept.employee_id = duplicate.employee_id;

  UPDATE employee_skills SET skill_id = :keep_id WHERE skill_id = :drop_id;

  DELETE FROM staffing_requirement_skills AS duplicate
  USING staffing_requirement_skills AS kept
  WHERE duplicate.skill_id = :drop_id
    AND kept.skill_id = :keep_id
    AND kept.staffing_requirement_id = duplicate.staffing_requirement_id;

  UPDATE staffing_requirement_skills SET skill_id = :keep_id WHERE skill_id = :drop_id;

  DELETE FROM skills WHERE id = :drop_id;

  COMMIT;
  ```

  Pastikan grup duplikatnya sudah kosong sebelum lanjut:

  ```sql
  SELECT lower(name), count(*) FROM departments GROUP BY lower(name) HAVING count(*) > 1;
  SELECT lower(name), count(*) FROM job_roles   GROUP BY lower(name) HAVING count(*) > 1;
  SELECT lower(name), count(*) FROM skills      GROUP BY lower(name) HAVING count(*) > 1;
  ```

  Setelah semua grup bersih, tandai migrasi yang gagal sebagai belum dijalankan lalu deploy lagi.
  Gunakan nama migrasi yang benar-benar gagal:

  ```bash
  npx prisma migrate resolve --rolled-back 20261014160000_workforce_normalized_name_uniqueness
  npx prisma migrate resolve --rolled-back 20261018120000_skills_normalized_name_uniqueness
  npm run db:migrate:deploy -w @staffora/api
  ```

  `migrate resolve --rolled-back` hanya membersihkan catatan kegagalan; ia tidak mengubah data.
  Jalankan perintah SQL penggabungan di atas sebelum langkah ini, karena deploy berikutnya akan
  mencoba index yang sama dan gagal lagi bila duplikatnya masih ada.

- **Pencegahan**: periksa duplikat sebelum menerapkan migrasi ke lingkungan yang sudah berisi data.
  Query diagnosa di atas bersifat read-only dan aman dijalankan lebih dulu.
