# Konvensi API

Kontrak resmi ada di [`openapi.yaml`](openapi.yaml). Dokumen ini menjelaskan bagaimana `apps/api/src` mewujudkan kontrak itu. Jika keduanya berbeda, kontrak yang berlaku dan selisihnya dicatat di dokumen modul terkait.

Status: dibuat dari kode `app.ts`, `common/http/*`, `common/errors/*`, dan `common/validation/*`. Kesesuaian dengan TSD §11 belum diverifikasi karena teks TSD tidak ada di repo.

## Dasar

- Base path: `/api/v1` (`apps/api/src/app.ts`, baris 127–155).
- Format: JSON. Batas body 1 MB (`app.ts`, baris 109).
- Tanggal: `YYYY-MM-DD`, dan rentang tanggal bersifat inklusif (`docs/architecture/overview.md`, bagian 4).
- Identifier: UUID v4 (baseline TSD, lihat `CLAUDE.md`).

## Header

| Header | Arah | Keterangan |
| --- | --- | --- |
| `X-CSRF-Token` | Request | Wajib untuk POST, PUT, PATCH, dan DELETE. Diambil dari `GET /api/v1/auth/csrf-token`. Lihat [authentication](../security/authentication.md). |
| `X-Request-Id` | Request dan response | Dipakai untuk korelasi log. Server mengisi `requestId` di setiap body error. |
| `Set-Cookie: staffora.sid` | Response | Cookie sesi. Lihat [authentication](../security/authentication.md). |

CORS hanya mengizinkan origin dari daftar (`http://localhost:5173`, `http://localhost:3000`, dan nilai `CORS_ORIGIN`), dengan `credentials: true`.

## Envelope sukses

Satu objek:

```json
{ "data": { "id": "…" } }
```

Daftar dengan paginasi:

```json
{
  "data": [ … ],
  "meta": { "page": 1, "pageSize": 20, "total": 42, "totalPages": 3 }
}
```

Bentuk `meta` mengikuti `PaginationMeta` di OpenAPI (`openapi.yaml`, baris 2413). Sumber: `common/http/response.ts`.

Respons tanpa body (misalnya DELETE yang berhasil) memakai status 204.

## Envelope error

```json
{
  "message": "Pesan yang bisa ditampilkan.",
  "code": "UNPROCESSABLE_ENTITY",
  "errors": { "name": ["Name is required."] },
  "meta": {},
  "requestId": "req-…"
}
```

Sumber: `common/errors/error-handler.ts`. Skema: `ErrorResponse` di OpenAPI (baris 1712).

- `code` adalah konstanta yang stabil. Daftarnya ada di [error-catalog](error-catalog.md).
- `errors` berisi pesan per field. Kosong untuk error non-validasi.
- `meta` dipakai untuk data tambahan, misalnya detail konflik kapasitas.
- Error yang tidak dikenal menghasilkan 500 dengan `code` `INTERNAL_SERVER_ERROR` dan pesan generik. Detail hanya masuk log.

## Validasi

- Body, query, dan params divalidasi dengan Zod (`common/validation/validate.ts`).
- Gagal validasi menghasilkan 422 dengan `code` `UNPROCESSABLE_ENTITY`.
- Param `id` yang bukan UUID juga ditolak 422 lewat `uuidParamSchema` (`app.ts`, baris 138 dan 145).

## Paginasi

- Query: `page` dan `pageSize`.
- Batas default dan maksimum berbeda antar modul. Contoh: skills memakai default 20 dan maksimum 100. Projects memakai `pageSize` 1–100.
- Kontrak OpenAPI tidak selalu menulis batas ini. Keseragaman batas belum diputuskan. Lihat catatan di [projects](../architecture/modules/projects.md).

## Status HTTP yang dipakai

| Status | Kode | Sumber |
| --- | --- | --- |
| 200 | — | `sendSuccess`, `sendList` |
| 201 | — | `sendCreated` |
| 204 | — | `sendNoContent` |
| 400 | `BAD_REQUEST` | `BadRequestError` |
| 401 | `UNAUTHORIZED` | `requireAuth`, `requireRole` saat belum login atau akun nonaktif |
| 403 | `FORBIDDEN` | `requireRole` saat peran tidak diizinkan, atau CSRF tidak valid |
| 404 | `NOT_FOUND` | `NotFoundError`, termasuk endpoint yang tidak ada |
| 409 | `CONFLICT` atau kode khusus | `ConflictError`, `CapacityConflictError` |
| 422 | `UNPROCESSABLE_ENTITY` atau kode khusus | `ValidationError` |
| 429 | `RATE_LIMITED` | Rate limiter |
| 500 | `INTERNAL_SERVER_ERROR` | Error tak terduga |
| 501 | `NOT_IMPLEMENTED` | Endpoint stub Sprint 1 |

Sumber: `common/errors/app-error.ts`, baris 1–14.

Endpoint yang masih stub menjawab 501. Capacity sudah tercatat (`apps/api/src/modules/capacity/capacity.routes.ts`). Projects dan lainnya ada di dokumen modul masing-masing.

## Rate limit

| Cakupan | Batas | Sumber |
| --- | --- | --- |
| Login, per IP dan email yang dinormalisasi | 5 percobaan per 15 menit | `common/auth/rate-limiter.ts` |
| Request terautentikasi, per user | 300 per menit | `rate-limiter.ts` |
| Request anonim, per IP | 100 per menit | `rate-limiter.ts` |

Batas ini disimpan di memori per proses. Lihat catatan di [authentication](../security/authentication.md).

## Urutan middleware

Urutan ini dibaca dari `apps/api/src/app.ts`:

1. Request ID
2. Pino HTTP. Query string dibuang dari log, dan field `search` diredaksi.
3. Helmet. CSP hanya aktif di production.
4. CORS dengan allowlist
5. `express.json` dengan batas 1 MB
6. Session PostgreSQL (`staffora.sid`)
7. Identity loader
8. CSRF untuk semua method selain GET, HEAD, dan OPTIONS
9. Rate limit umum di `/api/v1`
10. Router `/api/v1`
11. Not-found handler
12. Error handler pusat

Kesesuaian urutan ini dengan TSD §7.3 belum diverifikasi.

## Catatan

- Kolom `errors` untuk konflik unik tidak selalu diisi. Konflik unik memakai `code` khusus tanpa field.
- Kontrak dan kode belum selalu sama. Selisih per modul ada di [dokumen modul](../architecture/modules/).
