# Round 5 — F2: My Profile dibatasi ke Employee

Revisi yang direview: `ffe1157`
Revisi bukti: `181450b`

## Perubahan

`/my-profile` sebelumnya terbuka untuk keempat role, baik di sidebar maupun di route
guard. Setelah reviewer memverifikasi PRD dan file Figma pada round 5, dasarnya jelas:

- PRD §2.2 hanya memberi self-view di kolom Employee ("View Own").
- PRD US06.02 AC01.01 menyebut "Employee can access My Profile".
- BR-G02 menjamin employee profile untuk Project Manager, Resource Manager, dan
  Employee; Admin tidak termasuk.
- Mock Figma memakai satu chrome identik di semua frame — frame 18 menampilkan menu
  penuh di samping "Current role: Employee" — sehingga tidak bisa dibaca sebagai
  pemberian visibility per role. ADR-011 menjadikan Figma acuan visual, bukan otorisasi.

Sidebar dan route guard sama-sama pindah ke `EMPLOYEE_ROLES`. Konstanta `ALL_ROLES`
tidak lagi punya pemakai dan dihapus.

## Bukti

| Skenario | Hasil |
| --- | --- |
| Admin, sidebar `/dashboard` | Tidak ada entri My Profile: `Overview, Resources, Skills, Capacity, Projects, Allocations, Users` |
| Admin, buka `/my-profile` langsung | Heading `Access denied`, tanpa heading `My Profile` |
| Employee, buka `/` | Dialihkan ke `/my-profile`, heading `My Profile`, sidebar `Projects` + `My Profile` |

Screenshot pada 1440x900:

1. `01-admin-dashboard-no-my-profile-1440.png` — sidebar Admin tanpa My Profile.
2. `02-admin-my-profile-403-1440.png` — Admin membuka `/my-profile` langsung.
3. `03-employee-my-profile-1440.png` — Employee tetap dapat membuka halaman.

## Test

- `router-guards.test.tsx`: Employee mencapai halaman; Admin, Project Manager, dan
  Resource Manager mendapat heading `Access denied` dan tidak mendapat heading
  `My Profile`.
- `auth-ui.test.tsx`: menu Admin tidak lagi memuat tautan My Profile.

Mutation check: memperlebar guard dan menu kembali ke `PROJECT_ROLES` menggagalkan
kedua test (`2 failed | 33 passed`); dikembalikan, `35 passed`.

## Gate

`lint` lulus, `typecheck` lulus, `test` 6 file / 35 test lulus, `build` lulus.
