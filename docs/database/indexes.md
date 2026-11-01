# Index dan Constraint Database

Daftar ini dibaca dari migrasi di `apps/api/prisma/migrations/` dan dari `apps/api/prisma/schema.prisma`. Bila keduanya berbeda, migrasi yang berlaku di database.

Sumber aturan: TSD §12.1 (constraint wajib) dan §12.2 (index baseline). Teks TSD tidak ada di repo, jadi daftar syarat di bawah ini dikutip dari dokumen yang dibaca saat menulis.

## Unique

| Tabel | Kolom | Nama di DB | Migrasi | Syarat TSD |
| --- | --- | --- | --- | --- |
| `users` | `normalized_email` | `users_normalized_email_key` | init | `users(normalized_email)` (§12.2) |
| `users` | `employee_id` | `users_employee_id_key` | init | — |
| `employees` | `employee_code` | `employees_employee_code_key` | init | Unik (§12.1) |
| `employees` | `work_email` | `employees_work_email_key` | init | Unik (§12.1) |
| `departments` | `lower(name)` | `departments_name_lower_key` | 20261014160000 | Unik ternormalisasi (§12.1) |
| `job_roles` | `lower(name)` | `job_roles_name_lower_key` | 20261014160000 | Unik ternormalisasi (§12.1) |
| `skills` | `lower(name)` | `skills_name_lower_key` | 20261018120000 | Unik ternormalisasi (§12.1) |
| `skills` | `name` | `skills_name_key` | init | Dipertahankan. Index `lower` dipakai untuk keunikan |
| `employee_skills` | `(employee_id, skill_id)` | `employee_skills_employee_id_skill_id_key` | init | Unik (§12.1) |
| `staffing_requirement_skills` | `(staffing_requirement_id, skill_id)` | `staffing_requirement_skills_..._key` | init | Unik (§12.1) |
| `projects` | `project_code` | `projects_project_code_key` | init | — |

Index `name` pada `departments`, `job_roles`, dan `skills` dari migrasi init juga ada. Index `lower(name)` ditambahkan kemudian untuk keunikan case-insensitive.

## Index non-unik

| Tabel | Kolom | Nama di DB | Syarat TSD |
| --- | --- | --- | --- |
| `user_sessions` | `expire` | `user_sessions_expire_idx` | Pembersihan sesi kedaluwarsa |
| `employees` | `(status, department_id, job_role_id)` | `employees_status_department_id_job_role_id_idx` | §12.2 |
| `employee_skills` | `(skill_id, proficiency_level, employee_id)` | `employee_skills_skill_id_proficiency_level_employee_id_idx` | §12.2 |
| `projects` | `(status, project_manager_employee_id, start_date, end_date)` | `projects_status_project_manager_employee_id_start_date_end__idx` | §12.2 |
| `staffing_requirements` | `(project_id, start_date, end_date)` | `staffing_requirements_project_id_start_date_end_date_idx` | §12.2 |
| `allocations` | `(employee_id, start_date, end_date)` | `allocations_employee_id_start_date_end_date_idx` | Melayani kapasitas per karyawan (§10.4) |
| `allocations` | `(project_id, start_date, end_date)` | `allocations_project_id_start_date_end_date_idx` | §12.2 |

Nama index Prisma yang dipotong (`..._end__idx`, `..._i_key`) adalah batas panjang identifier PostgreSQL. Gunakan nama dari migrasi, bukan menebak dari nama kolom.

## Constraint lain

| Constraint | Status | Catatan |
| --- | --- | --- |
| `CHECK` untuk level proficiency 1–5 | **Tidak ada** | Validasi hanya di Zod (`skills.schema.ts`). Lihat [skills](../architecture/modules/skills.md) |
| `CHECK` untuk persentase alokasi 1–100 | **Tidak ada** | TSD §12.1 mewajibkannya. Belum ada di migrasi |
| `CHECK` untuk `end_date >= start_date` | **Tidak ada** | TSD §12.1 mewajibkannya. Validasi hanya di Zod dan service |
| Partial index untuk alokasi non-cancelled | **Tidak ada** | TSD §12.2 menyerahkannya ke query plan. Belum dibuat |

Tiga `CHECK` yang belum ada adalah temuan utama untuk Tech Lead. Jika dibiarkan, data yang masuk lewat seed atau SQL manual tidak dijaga oleh database.

## Foreign key dan aturan hapus

Dari `schema.prisma`, hanya relasi yang punya `onDelete` eksplisit yang didaftarkan:

| Model | Relasi | Aturan |
| --- | --- | --- |
| `User` | `employee` | `SetNull` |
| `EmployeeSkill` | `employee` | `Cascade` |
| `StaffingRequirement` | `project` | `Cascade` |
| `StaffingRequirementSkill` | `staffingRequirement` | `Cascade` |
| `Allocation` | `staffingRequirement` | `SetNull` |
| `Allocation` | `canceller` (User) | `SetNull` |

Relasi lain memakai aturan default Prisma. Pada `employee_skills` ke `skills`, migrasi menetapkannya sebagai `RESTRICT`, sesuai catatan di [skills](../architecture/modules/skills.md).

**Catatan untuk Tech Lead.** `EmployeeSkill` memakai `Cascade` terhadap `Employee`. Artinya menghapus karyawan di DB ikut menghapus riwayat skill-nya. TSD §12.1 mewajibkan referensi historis dinonaktifkan atau diarsipkan, bukan di-hard-delete. Aturan Cascade ini perlu ditinjau bersama keputusan DELETE penugasan skill (lihat [task S1-US02.02-BE-01](../tasks/sprint-1/US02.02.md)).

## Cara menambah index atau constraint

Lihat [migration policy](migration-policy.md).
