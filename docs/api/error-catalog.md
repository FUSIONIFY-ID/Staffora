# Katalog Error

Daftar semua `code` yang dikembalikan API, dengan status HTTP dan sumbernya di kode. Bentuk body error ada di [konvensi API](conventions.md).

Kolom **OpenAPI** menunjukkan apakah kode itu tercantum di `openapi.yaml`. "Tidak" berarti selisih, dan dicatat di bawah.

## Kode umum

Dari `apps/api/src/common/errors/app-error.ts`.

| HTTP | `code` | Kelas | Dipakai untuk | OpenAPI |
| --- | --- | --- | --- | --- |
| 400 | `BAD_REQUEST` | `BadRequestError` | Request tidak valid di luar validasi Zod | Ya |
| 401 | `UNAUTHORIZED` | `UnauthorizedError` | Belum login, atau akun nonaktif | Ya |
| 403 | `FORBIDDEN` | `ForbiddenError` | Peran tidak diizinkan, atau CSRF tidak valid | Ya |
| 404 | `NOT_FOUND` | `NotFoundError` | Resource tidak ada, termasuk akses ke data milik orang lain | Ya |
| 409 | `CONFLICT` | `ConflictError` | Konflik umum, bila tidak ada kode khusus | Ya |
| 422 | `UNPROCESSABLE_ENTITY` | `ValidationError` | Validasi Zod gagal. `errors` berisi per field | Ya |
| 429 | `RATE_LIMITED` | `RateLimitError` | Melewati batas rate limit | Ya |
| 500 | `INTERNAL_SERVER_ERROR` | — | Error tak terduga | Ya |
| 501 | `NOT_IMPLEMENTED` | `NotImplementedError` | Endpoint stub | Ya |

Pesan 404 untuk skill dan penugasan (`SKILL_NOT_FOUND`, `ASSIGNMENT_NOT_FOUND`, `EMPLOYEE_SKILLS_NOT_FOUND`) adalah konstanta pesan, bukan `code`. `code`-nya tetap `NOT_FOUND`.

## Kode domain

| HTTP | `code` | Modul | Sumber | Dipakai untuk | OpenAPI |
| --- | --- | --- | --- | --- | --- |
| 409 | `DUPLICATE_EMPLOYEE_CODE` | workforce | `workforce.errors.ts` | Kode karyawan sudah dipakai | Ya |
| 409 | `DUPLICATE_WORK_EMAIL` | workforce | `workforce.errors.ts` | Email kerja sudah dipakai | Ya |
| 409 | `DUPLICATE_DEPARTMENT_NAME` | workforce | `workforce.errors.ts` | Nama departemen sudah dipakai, case-insensitive | Ya |
| 409 | `DUPLICATE_JOB_ROLE_NAME` | workforce | `workforce.errors.ts` | Nama job role sudah dipakai, case-insensitive | Ya |
| 409 | `DUPLICATE_RESOURCE` | workforce | `workforce.errors.ts` (fallback) | Fallback untuk unique violation yang tidak dipetakan | **Tidak** |
| 409 | `DUPLICATE_SKILL_NAME` | skills | `skills.errors.ts` | Nama skill sudah dipakai, case-insensitive | Ya |
| 409 | `SKILL_ALREADY_ASSIGNED` | skills | `skills.errors.ts` | Pasangan karyawan dan skill sudah ada | Ya |
| 409 | `CAPACITY_CONFLICT` | allocations | `app-error.ts`, `CapacityConflictError` | Alokasi melewati 100%. **Kelasnya ada, tetapi belum dipanggil di runtime.** Mutasi alokasi masih menjawab 501 | Ya |
| 422 | `SKILL_INACTIVE` | skills | `skills.errors.ts` | Skill nonaktif dipakai untuk penetapan baru | Ya |
| 422 | `SKILL_REFERENCE_INVALID` | skills, staffing | `skills.errors.ts` | ID skill tidak dikenal atau berulang di staffing | Ya |

### Meta `CAPACITY_CONFLICT`

Kode ini membawa `meta` dengan field: `peakAllocation`, `requestedAllocation`, `remainingCapacity`, `conflictStartDate`, `conflictEndDate` (`app-error.ts`, baris 90–103). Klien dapat menampilkan detail konflik dari field ini.

## Selisih

- `DUPLICATE_RESOURCE` ada di kode sebagai fallback, tetapi tidak tercantum di OpenAPI. Keputusan: tambahkan ke kontrak, atau hapus dari kode.
- `SKILL_INACTIVE` dan `SKILL_ALREADY_ASSIGNED` di OpenAPI dipakai di beberapa endpoint. Pemetaan per endpoint ada di [dokumen modul skills](../architecture/modules/skills.md).
- Modul allocations belum tercantum di tabel ini secara lengkap. Kode lain di sana, seperti status `FULLY_ALLOCATED` dan `NOT_ASSIGNABLE`, adalah nilai status, bukan error.

## Menambah kode baru

1. Tambahkan kode di OpenAPI pada respons endpoint yang bersangkutan (`components/schemas` atau `responses`).
2. Tambahkan baris di tabel ini dengan status HTTP dan sumbernya.
3. Tambahkan tes yang membuktikan kode itu, dengan nama yang menyebut ID AC.
4. Bila kode itu berasal dari unique violation, petakan di `unique-violation.ts` dan modul yang bersangkutan, bukan di controller.
