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

## Daftar

- [Sprint 1 — US02.02](sprint-1/US02.02.md)
