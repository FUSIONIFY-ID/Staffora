# Peta layar Figma ke story PRD

> **Dugaan dari nama frame, perlu dikonfirmasi.** Seluruh tabel di file ini adalah dugaan dari nama frame, perlu dikonfirmasi. Nama frame dibaca dari tampilan kanvas dan bisa tidak persis. Cocokkan dengan Figma sebelum dipakai.

- File Figma: **Staffora — Product Design & Prototype (MVP v1.0)**. File key diambil dari URL file Figma yang dibagikan Tech Lead.
- Pemetaan ini dibuat 2026-11-02 dari daftar yang diberikan untuk tugas ini. Nama frame belum dicocokkan dengan Figma.
- Singkatan dokumen sama dengan `glossary.md`: `design-system.md`, `round-N.md`, dan `rbac-matrix.md`.
- Kolom Status PNG berisi `belum ada` untuk semua baris. Setelah PNG diekspor, ganti dengan path file (lihat `README.md`, bagian ekspor).

## Tabel pemetaan

| Frame | Story PRD (dugaan) | Catatan | Status PNG |
| --- | --- | --- | --- |
| 01 — Login | US01.01 | Layar login. Kode: `features/auth/login-page.tsx`. Layout sudah dibandingkan di `round-1.md` baris 28. | belum ada |
| 02 — Main App Shell | US01.02 | Navigasi berbasis peran. Kode: `app/layouts/`. Pencarian global dan ikon notifikasi ada di frame, tetapi belum dirender (`round-2.md` baris 79). | belum ada |
| 03 — Dashboard | US06.01 | Kode: `features/dashboard/dashboard-page.tsx`. Metrik masih kosong. `round-2.md` baris 82 menempatkan dashboard pribadi di US06.02 (lihat catatan 4). | belum ada |
| 04 — Resource List | US02.01 | Kode: `features/resources/resources-page.tsx`, masih scaffold. | belum ada |
| 05 — Resource Detail | US02.01 | Kode: `features/resources/resource-detail-page.tsx`, masih scaffold. Teks tautan kembali belum dikonfirmasi (lihat glosarium, bagian 3). | belum ada |
| 06 — Skill Management | US02.02 | Kode: `features/skills/skills-page.tsx`, masih scaffold. File task untuk story ini di repo: `docs/tasks/sprint-1/US02.02.md`. | belum ada |
| 07 — Project List | US03.01 | Kode: `features/projects/projects-page.tsx`, masih scaffold. | belum ada |
| 08 — Project Detail | US03.01 | Kode: `features/projects/project-detail-page.tsx`, masih scaffold. | belum ada |
| 09 — Staffing Requirement | US03.02 | Belum ada halaman khusus. Rute `/projects/:projectId/staffing` memakai `ProjectDetailPage` (`app/router/index.tsx` baris 134). | belum ada |
| 10 — Resource Finder | US03.03 | Belum ada halaman atau rute di `apps/web/src`. | belum ada |
| 11 — Allocation Drawer | US04.01 dan US04.02 | Belum ada komponen drawer. `components/ui/` berisi alert, badge, button, card, input, modal, dan spinner. | belum ada |
| 12 — Capacity View | US05.01 | Kode: `features/capacity/capacity-page.tsx`, masih scaffold. | belum ada |
| 13 — My Profile & Allocation | US06.02 | Kode: `features/my-profile/my-profile-page.tsx`, masih scaffold. Rute `/my-profile` hanya untuk Employee (`app/router/index.tsx` baris 162, `round-5.md`). | belum ada |
| 14 — Resource Create/Edit | US02.01 | Belum ada rute create atau edit karyawan di `app/router/index.tsx`. | belum ada |
| 15 — Project Create/Edit | US03.01 | Belum ada rute create atau edit proyek di `app/router/index.tsx`. | belum ada |
| 403 — Access Denied | US01.02 | Kode: `components/permission-denied.tsx`. `round-2.md` baris 8 dan `design-system.md` baris 100 menyebut nomor frame 18 (lihat catatan 1). | belum ada |

## Catatan selisih dan cakupan

1. **Nomor dan nama frame 403 dan 404.** `round-1.md` baris 6, `round-2.md` baris 8, dan `round-3.md` baris 8 menyebut `18 — 403 Access Denied` dan `19 — 404 Not Found`. Kode juga menyebut frame 18 dan 19 (`components/permission-denied.tsx` baris 14, `app/layouts/not-found-view.tsx` baris 6). Tabel di atas memakai `403 — Access Denied` apa adanya dan tidak memuat frame 404. Baris 403 perlu dicocokkan dengan Figma sebelum dipakai.
2. **Cakupan layar.** `design-system.md` baris 9 mencatat 19 layar yang dianalisis, tetapi tabel ini hanya memuat 16 baris. Frame yang belum ada di tabel, termasuk 404, belum dipetakan.
3. **Story tanpa file task.** Hanya `docs/tasks/sprint-1/US02.02.md` yang ada di repo. Story lain belum punya file task, dan PRD tidak ada di repo, sehingga ID AC belum bisa dicocokkan.
4. **Dashboard.** Frame 03 dipetakan ke US06.01, tetapi `round-2.md` baris 82 menempatkan dashboard pribadi di US06.02 (Sprint 4). Perlu dikonfirmasi.
5. **Belum dibuka di Figma.** Nama frame di tabel ini belum dicocokkan dengan Figma. Pencocokan dilakukan oleh developer yang punya akses (lihat `README.md`, bagian Akses Figma).
