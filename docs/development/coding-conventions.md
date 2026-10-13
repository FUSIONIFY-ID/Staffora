# Coding Conventions & Architecture Standards

Dokumen ini menjadi acuan standar penulisan kode di Staffora untuk menjaga konsistensi antar 2 Frontend Engineer dan 2 Backend Engineer.

---

## 1. Monorepo Boundary Rules (TSD 5.2)

1. `apps/web` **DILARANG KERAS** mengimpor kode/file dari `apps/api/src`.
2. Komunikasi Web ke API hanya melalui REST HTTP contract `/api/v1`.
3. Tipe data API di frontend digenerate secara otomatis dari OpenAPI contract menggunakan:
   ```bash
   npm run api:types
   ```
4. Dependency eksternal baru harus didefinisikan pada `package.json` aplikasi yang relevan atau root jika merupakan dev tooling monorepo. Root `package-lock.json` adalah satu-satunya lockfile.

---

## 2. Backend Module Convention (TSD 7.2)

Setiap domain module di `apps/api/src/modules/<domain>` wajib mengikuti pola file terpisah:

```text
modules/<domain>/
├── routes.ts       # Definisi endpoint HTTP, middleware chain (auth, validation)
├── controller.ts   # Parsing req HTTP, call service, format HTTP response
├── service.ts      # Domain business logic & validation rules
├── repository.ts   # Satu-satunya layer yang mengakses Prisma Client
├── schema.ts       # Zod schemas untuk request body, params, dan query
├── policy.ts       # Authorization rule (role & project ownership check)
└── types.ts        # Internal module TypeScript types
```

### Aturan Arsitektur Backend (TSD 7.4):
- **Controller harus tipis**: Dilarang meletakkan database query atau kalkulasi kapasitas di controller.
- **Service Isolation**: Antar domain module hanya boleh memanggil public service interface module lain, tidak boleh mengakses repository module lain secara langsung.
- **Capacity Source of Truth**: Satu-satunya sumber kebenaran perhitungan kapasitas adalah `CapacityService` di `modules/capacity/capacity.service.ts`.
- **Concurrency Protection**: Semua mutasi alokasi wajib dijalankan dalam Prisma transaction dengan `SELECT ... FOR UPDATE` pada row employee (TSD 10.4).

---

## 3. Frontend Architecture & Component Standards (TSD 6)

1. **State Management**:
   - Seluruh server state wajib dikelola menggunakan **TanStack Query 5**.
   - Form handling menggunakan **React Hook Form 7 + Zod 4**.
   - React `useState` hanya untuk transient component UI state (misal: modal open, active filter).
2. **API Client**:
   - Menggunakan `apiClient` dari `src/api/client.ts` yang otomatis menyertakan session cookies (`credentials: "include"`) dan header `X-CSRF-Token` pada state-changing request (POST, PUT, PATCH, DELETE).
3. **Role & Protected UI**:
   - Menu navigasi dan action button disembunyikan berdasarkan role user saat ini.
   - Route dilindungi oleh `ProtectedRoute` di `src/app/router/protected-route.tsx`. Jika role tidak berhak, tampilkan status 403 Forbidden secara eksplisit, jangan menyamarkannya sebagai empty list.
4. **Design System & Styling**:
   - **Sumber kebenaran visual adalah design reference Figma: "Staffora — Product Design & Prototype (MVP v1.0)".** Light mode saja untuk MVP; dark mode belum ada dan tidak dikerjakan.
   - Token lengkap (warna, tipografi, radius, ukuran komponen, dan state screen) ada di `docs/ui-specs/design-system/design-system.md` beserta versi mesinnya `design-system.json`. Jangan menebak nilai visual di luar dokumen itu.
   - Ringkasnya: page `#F7F8FA`, surface `#FFFFFF`, border `#E5E7EB`, primary `#2563EB`, text `#171717` / `#525252` / `#737373`. Font `Exo 2`. Sidebar 240px, header 72px, gutter halaman 36px.
   - Gunakan token Tailwind CSS 4 dan utility classes, lalu definisikan nilai token sebagai CSS custom property di `src/index.css`.
   - Gunakan reusable primitives dari `src/components/ui/` (`Button`, `Card`, `Badge`, `Modal`, `Alert`, `Input`, `Spinner`). Jangan membuat set komponen kedua untuk peran yang sama.
   - Catatan sejarah: dokumen ini sebelumnya menetapkan tema dark `#0a0f1d`. Aturan itu **sudah tidak berlaku** setelah Tech Lead menetapkan Figma sebagai acuan pada 2026-10-13. Jika menemukan sisa kode bertema dark, itu utang teknis, bukan contoh yang boleh diikuti.

---

## 4. Penamaan & Code Style

- **File Limit**: Tidak ada file produksi yang melebihi 300 baris kode. Pecah file secara proaktif jika mencapai 250 baris.
- **TypeScript Strict Mode**: `noImplicitAny: true`, dilarang menggunakan `any` tanpa alasan jelas.
- **Identifier**:
  - Variabel & fungsi: `camelCase`
  - React components & Types/Interfaces: `PascalCase`
  - Database table & column: `snake_case`
  - URL routes: `kebab-case` (e.g. `/staffing-requirements`, `/resource-finder`)
  - JSON payload: `camelCase` (e.g. `startDate`, `allocationPercentage`)
- Detail lengkap standar koding dapat dilihat di [docs/CODING_STANDARD.md](../CODING_STANDARD.md) dan checklist review di [docs/CODE_REVIEW_CHECKLIST.md](../CODE_REVIEW_CHECKLIST.md).
