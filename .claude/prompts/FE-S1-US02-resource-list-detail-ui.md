# AI Agent Implementation Prompt: [S1][FE][WORKFORCE] US02.01 — Resource List & Detail UI

> **Task ID:** `FE-S1-US02-resource-list-detail-ui`  
> **Sprint:** Sprint 1  
> **PIC / Suggested Owner:** FE1 (Wahyu)  
> **Tech Lead / Approver:** Arya Isnaidi  
> **User Story:** `US02.01 — Employee Resource Directory & Detail UI`  
> **Target Branch:** `dev` (via Pull Request from `FE-S1-US02-resource-list-detail-ui`)  
> **Source of Truth:** PRD Section 4 (Workforce Management), `docs/api/openapi.yaml`, `docs/CODING_STANDARD.md`

---

## 📋 Instruction for the Implementing Engineer / AI Agent

Anda ditugaskan sebagai **Frontend Engineer 1 (Wahyu)** untuk mengimplementasikan fitur lengkap antarmuka **Resource List & Detail UI** pada aplikasi web Staffora (`apps/web`). Anda wajib mengikuti seluruh arsitektur, standar penulisan kode, dan batasan keamanan yang telah ditetapkan oleh Tech Lead **Arya Isnaidi**.

---

## 🎯 Scope & Functional Requirements

### 1. Resource Directory List (`ResourcesPage`)
- **Lokasi file:** `apps/web/src/features/resources/resources-page.tsx` dan subkomponen terkait di `apps/web/src/features/resources/components/`.
- **Search & Debounce:** Input pencarian teks bebas (mencari berdasarkan nama karyawan, kode karyawan `employeeCode`, atau email `workEmail`) dengan debounce 300ms.
- **Filter Bar:**
  - Dropdown **Department** (diambil dinamis dari `GET /api/v1/departments`).
  - Dropdown **Job Role** (diambil dinamis dari `GET /api/v1/job-roles`).
  - Dropdown **Status** (`ALL`, `ACTIVE`, `INACTIVE`).
  - Tombol Reset Filter untuk mengembalikan ke nilai default.
- **Tabel Data Karyawan:**
  - Kolom: `Kode Karyawan`, `Nama Lengkap`, `Email`, `Departemen`, `Job Role`, `Status`, `Kapasitas Tersedia`, dan `Aksi`.
  - **Availability / Capacity Indicator:**
    - Hijau (`Badge variant="emerald"`): 100% kapasitas tersedia (beban kerja 0%).
    - Kuning/Amber (`Badge variant="amber"`): Kapasitas tersedia 1% - 99% (sebagian teralokasi).
    - Merah (`Badge variant="rose"`): Kapasitas 0% (100% teralokasi / beban penuh).
- **Pagination:** Kontrol halaman (`page` dan `pageSize` default 20) memanfaatkan metadata respons (`totalCount`, `totalPages`).
- **Aksi:** Tombol "Lihat Detail" mengarahkan pengguna ke `/resources/:employeeId`.

### 2. Form Pembuatan & Edit Karyawan (`ResourceFormModal`)
- **Lokasi file:** `apps/web/src/features/resources/components/resource-form-modal.tsx`.
- **RBAC Guard:** Tombol "Tambah Karyawan" dan aksi "Edit" **HANYA** ditampilkan dan dapat diakses oleh peran `ADMIN` dan `RESOURCE_MANAGER`. Untuk `PROJECT_MANAGER` dan `EMPLOYEE`, tombol ini **wajib disembunyikan**.
- **Form Schema & Validasi (React Hook Form + Zod):**
  - `employeeCode`: String wajib, huruf besar/angka (contoh: `EMP001`).
  - `fullName`: String wajib, minimal 2 karakter.
  - `workEmail`: Format email valid perusahaan (contoh: `name@staffora.internal`).
  - `departmentId`: UUID valid yang dipilih dari daftar departemen aktif.
  - `jobRoleId`: UUID valid yang dipilih dari daftar job role aktif.
  - `status`: Enum (`ACTIVE` | `INACTIVE`), default `ACTIVE`.
- **Mutasi & Cache Invalidation:**
  - Create: `POST /api/v1/employees` (mengirim CSRF token otomatis via `apiClient`).
  - Update: `PATCH /api/v1/employees/:id`.
  - Pada mutasi sukses: invalidate query `['employees']` dan tampilkan pesan feedback sukses via alert/toast.

### 3. Halaman Detail Karyawan (`ResourceDetailPage`)
- **Lokasi file:** `apps/web/src/features/resources/resource-detail-page.tsx`.
- **Breadcrumb & Navigasi:** Tombol kembali ke direktori `/resources`.
- **Header Profil:** Menampilkan Avatar/Inisial, Nama Lengkap, Kode Karyawan, Email, Departemen, Job Role, dan Status aktif/inaktif.
- **Section Keterampilan (Skills):**
  - Menampilkan daftar keahlian dari `data.skills`.
  - Indikator kemahiran (*Proficiency Level* 1 s/d 5) dengan visualisasi badge atau rating bintang:
    - Level 1: Beginner
    - Level 2: Elementary
    - Level 3: Intermediate
    - Level 4: Advanced
    - Level 5: Expert
- **Section Alokasi Proyek (Allocations):**
  - Menampilkan daftar penugasan proyek dari `data.allocations`.
  - Kolom: Nama Proyek, Peran Proyek, Rentang Tanggal (`startDate` - `endDate`), Persentase Alokasi (`%`), dan Status Alokasi (Aktif / Dibatalkan).
- **Section Ringkasan Kapasitas (Capacity Summary Card):**
  - Evaluasi beban puncak (*peak concurrent allocation*) dan sisa kapasitas (*remaining capacity*).
- **Read-Only Enforcement:**
  - Jika pengguna yang login adalah `PROJECT_MANAGER` atau `EMPLOYEE`, halaman ini sepenuhnya bersifat *read-only* (tidak ada tombol aksi edit/hapus).

### 4. Penanganan 6 Status Antarmuka (Mandatory UI States)
1. **Loading State:** Menampilkan visual indikator memuat (`Spinner` atau skeleton table) saat request pertama kali berjalan.
2. **Empty State:** Tampilan ramah dan ilustratif jika data karyawan kosong atau tidak ditemukan hasil pencarian.
3. **Populated State:** Tampilan tabel dan kartu detail yang rapi, modular, dan responsif (desktop-first 1440px / 1280px).
4. **Validation State:** Pesan error inline berwarna merah di bawah field form jika input tidak valid.
5. **Authorization (403) State:** Blokade akses form untuk role tanpa hak akses (`PROJECT_MANAGER` / `EMPLOYEE`).
6. **General Error State:** Alert banner penanganan error jika fetch gagal dengan tombol coba lagi (*Retry*).

---

## 🏛️ Architecture & Coding Standards (Mandatory)

1. **Batas Maksimal Baris File (Strict 300-Line Limit):**
   - Tidak boleh ada file yang melebihi 300 baris kode.
   - Pecah komponen secara modular ke dalam sub-folder `apps/web/src/features/resources/components/`:
     - `resource-table.tsx`: Komponen tabel data karyawan.
     - `resource-filters.tsx`: Bar pencarian dan filter dropdown.
     - `resource-form-modal.tsx`: Modal form create/edit karyawan.
     - `resource-skills-card.tsx`: Komponen kartu daftar skill.
     - `resource-allocations-table.tsx`: Komponen daftar alokasi proyek.
2. **Strict TypeScript:**
   - Dilarang keras menggunakan `any`, `@ts-ignore`, atau non-null assertions (`!`).
   - Seluruh fungsi yang diekspor wajib memiliki *explicit return types*.
   - Gunakan tipe data kontrak dari `apps/web/src/api/schema.d.ts` (jangan membuat tipe manual yang berulang).
3. **Isolasi Boundary:**
   - `apps/web` **DILARANG KERAS** mengimpor kode langsung dari `apps/api/src`. Gunakan `apiClient` dari `apps/web/src/api/client.js`.
4. **Testing Suite:**
   - Buat unit & component tests di `apps/web/tests/resources-ui.test.tsx` menggunakan Vitest + React Testing Library:
     - Render direktori resources dan filter pencarian.
     - Validasi tampilan ketersediaan kapasitas (badge warna).
     - Validasi proteksi otorisasi form (hanya muncul untuk `ADMIN` / `RESOURCE_MANAGER`).

---

## 🛠️ Verification Gates Sebelum Commit

Sebelum menyelesaikan task dan membuat commit, pastikan seluruh 4 gerbang verifikasi lolos:

```powershell
npm run lint
npm run typecheck
npm test -w @staffora/web
npm run build -w @staffora/web
```

---

## 🚨 Git Safety Gate

- **AI Agent DILARANG KERAS melakukan `git push`.** Batas eksekusi agent berhenti pada `git commit` di branch lokal `FE-S1-US02-resource-list-detail-ui`.
- Format Conventional Commit:
  ```text
  feat(resources): [FE-S1-US02] implement resource list, filters, form, and detail UI [US02.01 - AC02.01]
  ```
- Setelah commit lokal selesai, berikan perintah manual berikut kepada developer:
  ```bash
  git push -u origin FE-S1-US02-resource-list-detail-ui
  ```
