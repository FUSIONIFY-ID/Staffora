# Git Workflow & Rebase Collaboration Guidelines

Dokumen ini mengatur alur kerja Git, standar penamaan branch, dan aturan keselamatan commit/push untuk tim internal Staffora.

---

## 1. Struktur Tim & Pembagian Tanggung Jawab

| Peran | Anggota Tim | Tanggung Jawab Utama |
| :--- | :--- | :--- |
| **Tech Lead** | **Arya Isnaidi** | Arsitektur, approval PR/release, ADR, dan final acceptance sign-off |
| **QA & DevOps** | **Fikri** | Infrastruktur CI/CD, Docker, automation, pengujian regresi & E2E |
| **Frontend Engineers** | **Wahyu & Nabil** | Implementasi Web UI, forms, state management TanStack Query (Stream A & B) |
| **Backend Engineers** | **Saiful & Jundy** | Express.js API, Prisma migrations, Capacity engine, RBAC (Stream A & B) |

> ⚠️ **Catatan Penting Tech Lead (Arya Isnaidi):**
> Mengingat engineer pelaksana bertaraf junior, seluruh developer dan AI Agent **DILARANG KERAS** mengembangkan fitur di luar scope, dilarang asal commit, dilarang asal push, dan dilarang bypass quality gates. Setiap pekerjaan wajib memiliki kartu / User Story (`USxx.xx — ACxx.xx`) yang jelas.

---

## 2. Alur Branching Menggunakan Rebase

Seluruh pengerjaan fitur baru **WAJIB** berbasis pada branch `dev` menggunakan alur **rebase**:

### Langkah 1: Sinkronisasi & Rebase dari `dev`
Sebelum membuat branch baru, pastikan branch `dev` lokal mutakhir:
```bash
git checkout dev
git pull --rebase origin dev
```

### Langkah 2: Buat Branch Fitur Baru
Gunakan format nama branch yang telah dibakukan:
```bash
git checkout -b <nama-branch>
```

---

## 3. Format Baku Penamaan Branch

Format branch:
```text
[FE/BE/DB/QA]-S<SprintNumber>-[Kode]-subjudultask
```

### Prefix Layer:
- `FE` : Dikerjakan oleh Frontend (Wahyu / Nabil)
- `BE` : Dikerjakan oleh Backend (Saiful / Jundy)
- `DB` : Skema database, migrasi Prisma, atau seeding (Saiful / Jundy / Arya)
- `QA` : Pengujian otomatis, CI/CD, atau verifikasi akseptansi (Fikri)

### Contoh Penamaan yang Valid:
- `FE-S1-US01-login-screen`
- `BE-S1-US01-session-auth-endpoints`
- `DB-S1-US01-user-sessions-schema`
- `FE-S2-US03-project-list-and-detail`
- `BE-S2-US03-staffing-requirement-crud`
- `BE-S3-US04-allocation-concurrency-lock`
- `FE-S3-US05-capacity-timeline-view`
- `QA-S1-US01-verify-auth-session-flow`

> ❌ **Dilarang:** Menggunakan nama branch sembarangan seperti `feature/login`, `fix-bug`, `test`, `wahyu-branch`, atau langsung bekerja di `dev` / `main`.

---

## 4. Siklus Kerja & Sinkronisasi Sebelum PR

Sebelum mengajukan Pull Request, lakukan rebase kembali ke `dev` terbaru untuk mencegah konflik:

```bash
# 1. Update dev lokal
git checkout dev
git pull --rebase origin dev

# 2. Rebase branch kerja Anda di atas dev terbaru
git checkout <nama-branch-anda>
git rebase dev

# 3. Jalankan verifikasi lokal (wajib lulus 100%)
npm run lint
npm run typecheck
npm test
npm run build

# 4. Push branch kerja Anda ke remote
git push -u origin <nama-branch-anda>
```

---

## 5. Aturan Keselamatan Commit & Push (Safety Gate)

Developer dan AI Agent wajib mematuhi batasan berikut:
1. **Dilarang Push Langsung ke `dev` atau `main`**: Setiap perubahan hanya boleh masuk ke `dev` melalui Pull Request yang telah di-review dan di-approve.
2. **Dilarang Blind Staging (`git add .` / `git add -A`)**: Stage hanya file yang spesifik diubah untuk task tersebut (`git add <file1> <file2>`). Jangan memasukkan file temporary, `.env`, log, atau build artifacts.
3. **Commit Message Standar Conventional Commits**:
   ```text
   <type>(<scope>): <subject> [USxx.xx - ACxx.xx]
   ```
   Contoh:
   - `feat(auth): implement session cookie authentication [US01.01 - AC02.01]`
   - `feat(capacity): add sweep-line concurrent workload engine [US05.01 - AC02.03]`
   - `fix(projects): prevent allocation outside project date window [US04.01 - AC02.08]`
   - `test(capacity): add tests for 15 mandatory capacity scenarios [US04.01 - AC03.01]`
4. **Mandatory Quality Gate**: Dilarang commit jika salah satu dari `lint`, `typecheck`, `test`, atau `build` gagal.

---

## 6. Review & Approval Pull Request

- **Target PR**: Seluruh PR fitur normal mengarah ke branch `dev`.
- **Reviewer Tunggal**: **Arya Isnaidi (Tech Lead)** melakukan review akhir berdasarkan checklist di [docs/CODE_REVIEW_CHECKLIST.md](../CODE_REVIEW_CHECKLIST.md).
- **Branch `main`**: Merupakan branch produksi yang diproteksi. Promosi dari `dev` ke `main` hanya dilakukan oleh Arya Isnaidi setelah pengujian regresi oleh Fikri (QA) dinyatakan lulus.
