---
name: add-api-endpoint
description: Add a modular Express.js 5 API endpoint in Staffora according to TSD Section 7 & 11.
---

# Add a Staffora API endpoint

Use this skill only after the user story, acceptance criteria, and module boundaries are understood. Staffora is an npm workspace with an Express.js 5 API and Prisma ORM 7.

## Structure (TSD 7.2)

Create the domain module files under `apps/api/src/modules/<module>/`:

```text
apps/api/src/modules/<module>/
  <module>.routes.ts       # Route definitions & middleware chain
  <module>.controller.ts   # Express request unwrapping & response sending
  <module>.service.ts      # Domain business logic & validation rules
  <module>.repository.ts   # Prisma access (sole layer touching database)
  <module>.schema.ts       # Zod validation schemas
  <module>.policy.ts       # Role & object ownership authorization
  <module>.types.ts        # Internal module TypeScript types
```

Mount the router in `apps/api/src/app.ts` under `/api/v1/<endpoint>`.

## Required workflow

1. Confirm the user story (`USxx.xx`) and acceptance criteria (`ACxx.xx`).
2. Update the OpenAPI specification in `docs/api/openapi.yaml` and regenerate types (`npm run api:types`).
3. Validate request params, query, and body using Zod middleware (`validateParams`, `validateQuery`, `validateBody`).
4. Controller calls service; service handles business logic and invokes repository or public service interface.
5. All mutations impacting employee allocation MUST invoke `CapacityService` inside a Prisma transaction with `SELECT ... FOR UPDATE` row locking (TSD 10.4).
6. Send standardized response envelopes:
   - Single item: `{ "data": ... }`
   - List: `{ "data": [], "meta": { "page": 1, "pageSize": 20, "total": 0, "totalPages": 0 } }`
   - Error: `{ "message": "...", "code": "...", "errors": {}, "meta": {}, "requestId": "..." }`
7. Add unit/API integration tests with Vitest and Supertest in `apps/api/tests/`.
8. Verify quality gates: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Review checklist

- [ ] Endpoint is mounted under `/api/v1/`.
- [ ] Route uses `requireAuth()` and `requireRole(...)` where required.
- [ ] Zod schema validates all inputs before reaching service layer.
- [ ] Controller contains no direct database queries or capacity calculations.
- [ ] File size stays under 300 lines (proactively split at 250 lines).
- [ ] All tests pass cleanly.
