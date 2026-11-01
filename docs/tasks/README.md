# Task Breakdown

Folder ini berisi task yang sudah dipecah per story. Agent dan developer membaca task dari sini sebelum menyentuh kode. Trello dipakai untuk memindahkan kartu. Sumber kebenaran untuk pekerjaan teknis adalah file task di repo.

## Aturan

- Satu file per story: `docs/tasks/<sprint>/<USxx.xx>.md`.
- ID task: `S<sprint>-<USxx.xx>-<PREFIX>-<nn>`. PREFIX: `BE`, `FE`, `DB`, atau `QA`.
- Teks AC tidak disalin. Tulis ID-nya saja (misalnya `AC01.05`) dan rujuk PRD.
- Status: `ready` (boleh dikerjakan), `blocked` (menunggu keputusan, sebutkan siapa), atau `done`.
- Agent hanya menyentuh path di "Boleh disentuh". Kalau butuh path lain, berhenti dan tanya.
- Agent tidak boleh: `git push`, `git add -A`, menambah endpoint di luar `docs/api/openapi.yaml`, atau mengerjakan task yang berstatus `blocked`.
- Task yang sudah `done` tidak dikerjakan ulang.

## Template task

```
## <ID> — <judul singkat>
- Status: ready | blocked (<siapa>) | done
- Story/AC: <USxx.xx> · <ID AC>
- Branch: <prefix>-S<n>-<USxx>-<slug>
- Dependensi: <ID task> | —
- Kontrak: <path OpenAPI yang harus diubah dulu> | tidak ada
- Migration: ya (<nama>) | tidak
- Boleh disentuh: <daftar path>
- Di luar scope: <daftar>
- Tes wajib: <nama tes> → <ID AC>
- Gate: lint, typecheck, test, build
- Output: commit lokal | catatan | keputusan
- Berhenti bila: <kondisi>
```

## Pengecualian: task lintas modul

Task yang bukan bagian story PRD disimpan di `docs/tasks/cross-cutting/`. Task ini tetap perlu penugasan Tech Lead sebelum dikerjakan. Tag commit-nya memakai `[QA-S1-SEC]` atau `[QA-S1-DOC]`, karena tidak ada ID AC.

## Definition of Ready

Task hanya boleh berstatus `ready` jika semua item di bawah terpenuhi (DoR). Task yang tidak memenuhi DoR berstatus `blocked`, dan agen tidak mengerjakannya. Penulis task atau Tech Lead memperbaiki field yang kurang.

- [ ] **(a) ID task** mengikuti `S<n>-USxx.xx-<PREFIX>-<nn>`, misalnya `S1-US02.02-BE-01`. Task lintas modul memakai format ID yang sudah dipakai di file-nya, misalnya `S1-SEC-01`, sampai Tech Lead menetapkan format lintas modul.
- [ ] **(b) Story dan AC** disebut eksplisit di field `Story/AC`: ID story (`USxx.xx`) dan ID AC (`ACxx.xx`). Semua ID itu ada di PRD. Rentang seperti `AC01.01–AC01.05` diterima jika setiap ID di dalamnya ada di PRD. Task lintas modul menulis `lintas modul`, karena tidak punya story PRD.
- [ ] **(c) Boleh disentuh** berisi path file spesifik, misalnya `apps/api/tests/skills.test.ts`. Folder atau glob seperti `apps/api/**` tidak memenuhi. Task read-only menulis `tidak ada (read-only)`.
- [ ] **(d) Tes wajib** memetakan setiap tes ke ID AC dengan format `<nama tes> → <ID AC>`. Task read-only menulis `tidak ada (read-only)` secara eksplisit. Task lain tidak boleh berisi `—`.
- [ ] **(e) Kontrak** menulis `tidak ada`, atau path file OpenAPI yang harus diubah lebih dulu, misalnya `docs/api/openapi.yaml`.
- [ ] **(f) Dependensi** sudah berstatus `done`, atau tertulis `—`. Keputusan yang belum diambil dihitung sebagai dependensi yang belum selesai.
- [ ] **(g) Tidak membutuhkan secret.** Nama variabel boleh ditulis, nilainya tidak pernah ditulis di task.

PRD ada di Notion, bukan di repo. Pemeriksaan ID terhadap PRD dilakukan oleh penulis task.

## Konvensi kartu Trello

Ini konvensi yang diusulkan dan belum diterapkan pada kartu lama. Kartu lama tidak diubah untuk menerapkannya.

- **Judul kartu:** `[S<n>][<FE|BE|DB|QA>][<TOPIK>] USxx.xx — <judul>`. Contoh: `[S1][BE][SKILLS] US02.02 — Label skala proficiency`.
- **Baris pertama deskripsi:** `Task ID: S<n>-USxx.xx-<PREFIX>-<nn>`. Contoh: `Task ID: S1-US02.02-BE-01`.
- Pemetaan kartu ke file task memakai baris `Task ID`, bukan judul. Judul hanya untuk tampilan.

## Daftar

- [Sprint 1 — US02.02](sprint-1/US02.02.md)
- [Lintas modul — keamanan](cross-cutting/security.md)

## Status DoR saat ini

Diperiksa pada 2026-11-02 terhadap [sprint-1/US02.02.md](sprint-1/US02.02.md). Pemeriksaan ini menilai format dan kelengkapan field. ID AC belum dicek ke PRD. File task tidak diubah.

| Task | Status di file | Hasil DoR | Temuan |
| --- | --- | --- | --- |
| S1-US02.02-BE-01 | blocked (Tech Lead) | Tidak memenuhi | (b) hanya merujuk BR02, tanpa ID AC. (c) berisi folder `docs/architecture/decisions/` dan alternatif catatan di PRD. (d) berisi `—`. |
| S1-US02.02-BE-02 | blocked (Tech Lead) | Tidak memenuhi | (c) memakai glob `apps/api/src/modules/skills/**`. (f) dependensinya adalah keputusan label yang belum diambil. |
| S1-US02.02-QA-01 | done | Tidak berlaku, sudah done | Tidak dikerjakan ulang. (b) tidak ada AC. (d) tes tidak dipetakan ke AC. |
| S1-US02.02-FE-01 | ready | Tidak memenuhi | (d) `Tes wajib` berisi `—`, seharusnya `tidak ada (read-only)`. Menurut aturan, status harus `blocked` sampai field diperbaiki. |

Status FE-01 di file masih `ready`. Keputusan Tech Lead diperlukan untuk menyelaraskannya.
