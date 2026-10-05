---
name: add-audit-log
description: Maintain audit metadata for Staffora domain mutations according to TSD 9.4 & 14.2.
---

# Staffora Audit Logging & Mutation Metadata

Per TSD 9.4 & 14.2, Staffora uses embedded audit fields on mutable business tables. A dedicated generic audit-log table is NOT used in MVP (ADR-010).

## Audit Metadata Baseline

Every mutable business table (`employees`, `projects`, `staffing_requirements`, `allocations`, `skills`) stores:
- `created_at`: UTC timestamp (`timestamptz`).
- `created_by`: UUID of the authenticated creator.
- `updated_at`: UTC timestamp (`timestamptz`).
- `updated_by`: UUID of the authenticated updater.

`allocations` additionally store lifecycle metadata:
- `cancelled_at`: UTC timestamp when cancelled.
- `cancelled_by`: UUID of the user who cancelled the allocation.

## Rules

1. Derive `created_by` and `updated_by` strictly from `req.user.id` (server-side session). Never accept actor identity from the client body.
2. In update mutations, preserve `created_at` and `created_by` intact.
3. Historical records are preserved for auditability; never hard-delete allocations or projects through operational flows (BR-G15).
4. Redact sensitive values (`password`, `passwordHash`, `cookie`, `session`, `csrfToken`) from structured API request logs.
