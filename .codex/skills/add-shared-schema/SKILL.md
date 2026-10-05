---
name: add-shared-schema
description: Maintain cross-application API contracts and schemas via OpenAPI 3.1 in Staffora.
---

# Add / Update Shared API Contract (TSD 5.2)

In Staffora, `apps/web` **DILARANG KERAS** mengimpor kode dari `apps/api/src`. API contract dibagikan melalui OpenAPI 3.1 specification.

## Protocol

1. Define or update the endpoint request/response schema in `docs/api/openapi.yaml`.
2. Generate TypeScript API types for the frontend:
   ```bash
   npm run api:types
   ```
3. In `apps/api`, implement the matching Zod schema in `src/modules/<module>/<module>.schema.ts`.
4. In `apps/web`, use the generated types or Zod client schemas for form validation.
5. Verify compatibility across the monorepo: `npm run typecheck`, `npm run lint`, `npm test`.
