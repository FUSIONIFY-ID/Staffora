# Matriks Akses Peran

Matriks ini menunjukkan peran yang boleh memanggil setiap endpoint, berdasarkan guard di file routes. Peran: `ADMIN`, `PROJECT_MANAGER` (PM), `RESOURCE_MANAGER` (RM), dan `EMPLOYEE`.

Yang dibaca: `requireAuth()` (sudah login dan aktif) dan `requireRole(...)` di setiap `apps/api/src/modules/*/*.routes.ts`. Pembatasan per data, misalnya EMPLOYEE hanya boleh membaca profilnya sendiri, ada di `policy.ts` dan **tidak** ditampilkan di tabel ini. Catatannya ada di kolom "Pembatasan data".

Legenda:
- **Semua** berarti semua peran yang sudah login.
- **Publik** berarti tanpa login.

## Identity

| Method dan path | Peran | Pembatasan data | Sumber |
| --- | --- | --- | --- |
| POST `/auth/login` | Publik | Rate limit login | `identity.routes.ts` |
| GET `/auth/csrf-token` | Publik | Sesi anonim | `identity.routes.ts` |
| POST `/auth/logout` | Semua | — | `identity.routes.ts` |
| GET `/auth/me` | Semua | Hanya profil sendiri | `identity.routes.ts` |
| GET, POST `/users` | ADMIN | — | `identity.routes.ts` (`usersRouter.use`) |
| PATCH `/users/{id}` | ADMIN | — | `identity.routes.ts` (`usersRouter.use`) |

## Workforce

| Method dan path | Peran | Pembatasan data | Sumber |
| --- | --- | --- | --- |
| GET `/departments` | Semua | — | `workforce.routes.ts` |
| POST `/departments` | ADMIN | — | `workforce.routes.ts` |
| GET `/job-roles` | Semua | — | `workforce.routes.ts` |
| POST `/job-roles` | ADMIN | — | `workforce.routes.ts` |
| GET `/employees` | ADMIN, PM, RM | — | `workforce.routes.ts` |
| POST `/employees` | ADMIN, RM | — | `workforce.routes.ts` |
| GET `/employees/{id}` | ADMIN, PM, RM, EMPLOYEE | EMPLOYEE hanya dirinya sendiri | `workforce.routes.ts`, `workforce.policy.ts` |
| PATCH `/employees/{id}` | ADMIN, RM | — | `workforce.routes.ts` |

## Skills

| Method dan path | Peran | Pembatasan data | Sumber |
| --- | --- | --- | --- |
| GET `/skills` | ADMIN, PM, RM | EMPLOYEE ditolak 403 | `skills.routes.ts` |
| POST `/skills` | ADMIN, RM | — | `skills.routes.ts` |
| PATCH `/skills/{id}` | ADMIN, RM | — | `skills.routes.ts` |
| GET `/employees/{id}/skills` | ADMIN, PM, RM, EMPLOYEE | EMPLOYEE hanya dirinya sendiri. Id orang lain dijawab 404 | `skills.routes.ts`, `skills.policy.ts` |
| POST `/employees/{id}/skills` | ADMIN, RM | — | `skills.routes.ts` |
| PATCH `/employees/{id}/skills/{skillId}` | ADMIN, RM | — | `skills.routes.ts` |
| DELETE `/employees/{id}/skills/{skillId}` | ADMIN, RM | — | `skills.routes.ts` |

## Projects

| Method dan path | Peran | Pembatasan data | Sumber |
| --- | --- | --- | --- |
| GET `/projects` | Semua | Belum dibatasi per data di route. Lihat [projects](../architecture/modules/projects.md) | `projects.routes.ts` |
| POST `/projects` | ADMIN, PM | — | `projects.routes.ts` |
| GET `/projects/{id}` | Semua | Tidak ada pembatasan per data di `canViewProject` | `projects.routes.ts`, `common/auth/policy.ts` |
| PATCH `/projects/{id}` | ADMIN, PM | PM hanya proyek yang ditugaskan kepadanya. Proyek lain dijawab 404 | `projects.routes.ts`, `common/auth/policy.ts` |

## Staffing

| Method dan path | Peran | Pembatasan data | Sumber |
| --- | --- | --- | --- |
| GET `/projects/{id}/staffing-requirements` | Semua | — | `staffing.routes.ts` |
| POST `/projects/{id}/staffing-requirements` | ADMIN, PM | — | `staffing.routes.ts` |
| PATCH `/staffing-requirements/{id}` | ADMIN, PM | — | `staffing.routes.ts` |
| DELETE `/staffing-requirements/{id}` | ADMIN, PM | — | `staffing.routes.ts` |

## Allocations

| Method dan path | Peran | Pembatasan data | Sumber |
| --- | --- | --- | --- |
| GET `/allocations` | Semua | Belum dicek di route. Lihat [allocations](../architecture/modules/allocations.md) | `allocations.routes.ts` |
| GET `/allocations/{id}` | Semua | Belum dicek di route | `allocations.routes.ts` |
| POST `/allocations` | ADMIN, PM, RM | — | `allocations.routes.ts` |
| PATCH `/allocations/{id}` | ADMIN, PM, RM | — | `allocations.routes.ts` |
| POST `/allocations/{id}/end` | ADMIN, PM, RM | — | `allocations.routes.ts` |
| POST `/allocations/{id}/cancel` | ADMIN, PM, RM | — | `allocations.routes.ts` |

## Capacity dan Resource Finder

| Method dan path | Peran | Pembatasan data | Sumber |
| --- | --- | --- | --- |
| GET `/capacity` | ADMIN, RM, PM | Endpoint stub, 501 | `capacity.routes.ts` |
| GET `/capacity/employees/{id}` | Semua | Endpoint stub, 501. **Belum ada pembatasan peran.** Harus ditambahkan sebelum diimplementasikan | `capacity.routes.ts` |
| GET `/resource-finder` | ADMIN, PM, RM | — | `resource-finder.routes.ts` |

## Dashboard dan profil sendiri

| Method dan path | Peran | Pembatasan data | Sumber |
| --- | --- | --- | --- |
| GET `/dashboard` | Semua | Isi per peran belum dicek. Lihat [dashboard](../architecture/modules/dashboard.md) | `dashboard.routes.ts` |
| GET `/me` | Semua | Diarahkan ke data milik user. Belum dicek di route | `dashboard.routes.ts` |

## Health

| Method dan path | Peran | Sumber |
| --- | --- | --- |
| GET `/health/live` | Publik | `health.routes.ts` |
| GET `/health/ready` | Publik | `health.routes.ts` |

## Selisih dengan TSD

- TSD §8.4 menyebut RM dapat mengelola workforce dan allocation lintas proyek. Itu konsisten dengan tabel di atas.
- TSD §8.4 menyebut EMPLOYEE hanya membaca profil, skill, penugasan proyek, alokasi, dan kapasitas miliknya sendiri. Route `GET /projects`, `GET /allocations`, dan `GET /capacity/employees/{id}` belum menunjukkan pembatasan ini. Perlu dicek di service atau sebelum endpoint diimplementasikan.
- Matriks ini tidak diverifikasi terhadap PRD, karena teksnya tidak ada di repo.

## Cara memeriksa ulang

```bash
grep -rn "requireRole(" apps/api/src/modules --include=*.routes.ts
```

Bila ada route baru atau guard yang berubah, perbarui tabel ini di PR yang sama.
