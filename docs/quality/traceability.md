# Traceability: Story → AC → Endpoint → Tes

Dokumen ini memetakan ID AC di PRD ke endpoint dan file tes. Teks AC tidak disalin, sumbernya tetap PRD.

Status:
- **Ada**: endpoint dan tes sudah tercatat di kode dan dicek.
- **Sebagian**: ada sebagian, sisanya belum.
- **Belum dipetakan**: belum diperiksa. Ini bukan berarti belum ada.

Kolom bukti hanya diisi jika sudah dicek. Isi kolom ini saat task selesai, bukan dari ingatan.

## US02.02 — Manage Skills & Employee Proficiency

| AC | Endpoint | Bukti tes | Status |
| --- | --- | --- | --- |
| AC01.01 Admin dan Resource Manager membuat skill | `POST /skills` | `apps/api/tests/skills.test.ts` (role 403 untuk PM dan Employee) | Ada |
| AC01.02 Nama skill wajib | `POST /skills` | 422 `errors.name` | Ada |
| AC01.03 Nama unik case-insensitive | `POST /skills` | 409 dan guard indeks | Ada |
| AC01.04 Rename dan Active/Inactive | `PATCH /skills/{id}` | test lifecycle dan filter | Ada |
| AC01.05 Skill nonaktif tidak bisa ditetapkan baru | `POST /employees/{id}/skills`, staffing requirement | 422 `SKILL_INACTIVE` | Ada |
| AC02.01 Assign dan remove | `POST`, `DELETE /employees/{id}/skills/{skillId}` | test assign dan remove | Ada |
| AC02.02 Level wajib 1–5 | `POST /employees/{id}/skills` | test validasi level | Ada |
| AC02.03 Pasangan karyawan dan skill tidak ganda | `POST /employees/{id}/skills` | 409 `SKILL_ALREADY_ASSIGNED` | Ada |
| AC02.04 Update proficiency | `PATCH /employees/{id}/skills/{skillId}` | test update | Ada |
| AC02.05 Employee baca diri sendiri, tidak bisa ubah | `GET` diri sendiri, tulis 403 | test otorisasi | Ada |
| AC03.01–AC03.05 Label skala 1–5 | — | — | Belum dipetakan (lihat task S1-US02.02-BE-02) |

Sumber bukti untuk baris "Ada": [PR #20](https://github.com/FUSIONIFY-ID/Staffora/pull/20) dan hasil review-nya. Dokumen review Round 3 belum ter-commit, jadi tidak ditautkan dari sini. Status belum dicek ulang di branch ini.

## US01.01 — Sign In & Sign Out

| AC | Endpoint | Bukti tes | Status |
| --- | --- | --- | --- |
| AC01.01–AC01.05 Form login | `POST /auth/login` | — | Belum dipetakan |
| AC02.01–AC02.05 Hasil autentikasi | `POST /auth/login` | — | Belum dipetakan |
| AC03.01–AC03.04 Sesi dan logout | `POST /auth/logout`, `GET /auth/me` | — | Belum dipetakan |

## Story lain (belum dipetakan)

| Story | Judul | Modul | Status |
| --- | --- | --- | --- |
| US01.02 | Role-Based Access Control | identity | Belum dipetakan |
| US02.01 | Manage Employee Resource Profile | workforce | Belum dipetakan |
| US03.01 | Manage Projects | projects | Belum dipetakan |
| US03.02 | Define Project Staffing Requirement | staffing | Belum dipetakan |
| US03.03 | Search & Filter Resources for Staffing | resource-finder | Belum dipetakan |
| US04.01 | Assign Resource to Project | allocations | Belum dipetakan |
| US04.02 | Update / End / Cancel Allocation | allocations | Belum dipetakan |
| US05.01 | Workload, Capacity & Availability | capacity | Belum dipetakan |
| US06.01 | Workforce & Project Dashboard | dashboard | Belum dipetakan |
| US06.02 | Employee Self View | dashboard | Belum dipetakan |

Judul story diambil dari PRD dan Trello. Daftar AC lengkap untuk story di tabel ini belum dibaca, jadi AC-nya belum dituliskan.
