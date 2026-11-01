# UI specs Staffora

Folder ini berisi bahan desain dan bukti QA untuk layar web di `apps/web`. Isinya dokumen dan gambar, bukan kode.

Status: draf, dibuat 2026-11-02. Belum dikonfirmasi PRD dan Tech Lead.

## Isi folder

Daftar ini dicek dengan `ls` pada 2026-11-02.

- `design-system/design-system.md`: kontrak token dan komponen dari Figma, termasuk warna, tipografi, layout, serta layar 403 dan 404.
- `design-system/design-system.json`: nilai token dalam format mesin.
- `app-shell/qa/round-1/` sampai `round-3/`, dan `round-5/`: catatan review dan PNG bukti untuk app shell. Tidak ada `round-4/`.
- `figma-screen-map.md`: peta frame Figma ke story PRD. Isinya dugaan dari nama frame.
- `glossary.md`: istilah UI, status konsisten, dan usulan Bahasa Indonesia.

## Akses Figma

- File: **Staffora — Product Design & Prototype (MVP v1.0)**. File key: diambil dari URL file Figma yang dibagikan Tech Lead.
- Developer FE (Wahyu dan Nabil) perlu akses view untuk membaca frame. Akses edit hanya diperlukan bila file perlu diubah.
- Pemberi akses adalah pemilik file. Pemilik file dan prosesnya belum tercatat di repo, jadi Tech Lead perlu menetapkannya.
- Jika akses Figma tidak ada, agen berhenti dan meminta PNG frame dari developer. Agen tidak menebak tampilan dari nama frame.

## Ekspor frame ke PNG

1. Pilih frame di Figma, bukan layer di dalamnya.
2. Ekspor frame sebagai PNG.
3. Simpan di `docs/ui-specs/<fitur>/` dengan nama `<nn>-<slug>.png`.
   - `<fitur>` mengikuti nama folder di `apps/web/src/features/`, misalnya `auth`, `skills`, atau `resources`.
   - `<nn>` adalah nomor frame dua digit, misalnya `01`. Cara menulis nomor frame 403 belum ditetapkan.
   - `<slug>` adalah nama frame dalam huruf kecil dengan tanda hubung, misalnya `login`.
   - Contoh nama file: `01-login.png`.
4. Ganti `belum ada` di `figma-screen-map.md` dengan path PNG yang sudah dibuat.

## Aturan

- PNG adalah salinan offline. Jika PNG dan Figma berbeda, baca Figma dulu dan catat selisihnya.
- Jangan menyimpan token, password, atau secret di folder ini.
- Dokumen di folder ini tidak boleh menautkan ke folder audit atau ai yang belum di-commit (lihat `CLAUDE.md`, bagian Repository Layout).
- Istilah UI baru masuk ke `glossary.md` sebelum dipakai di kode.
- PRD adalah acuan akhir untuk perilaku dan teks. PRD tidak ada di repo, jadi semua usulan di folder ini belum dikonfirmasi PRD.

## Tautan

- Peta frame: [figma-screen-map.md](./figma-screen-map.md)
- Glosarium: [glossary.md](./glossary.md)
- Kontrak desain: [design-system.md](./design-system/design-system.md)
