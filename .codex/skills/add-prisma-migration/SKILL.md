---
name: add-prisma-migration
description: Safely change the Staffora PostgreSQL schema with Prisma ORM 7.
---

# Add a Staffora Prisma migration

Use for an approved task that changes `apps/api/prisma/schema.prisma`.

## Protocol

1. Start from the latest integration branch: `git checkout dev` and `git pull --rebase origin dev`.
2. Edit the schema in `apps/api/prisma/schema.prisma`.
3. Generate a migration with a descriptive name:
   ```bash
   npx prisma migrate dev --name <descriptive_name>
   ```
4. Review generated SQL in `apps/api/prisma/migrations/`; verify constraints, indexes, and relations.
5. Update `docs/database/erd.md` and `docs/database/schema.dbml` in the same pull request.
6. Verify local database migration: `npm run db:migrate -w @staffora/api`.
7. Re-run quality gate: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.

## Rules

- Table names use plural `snake_case`; column names use `snake_case`.
- Primary keys must be UUID v4 (`@id @default(uuid())`).
- Mutable tables require audit fields: `created_at`, `created_by`, `updated_at`, `updated_by`.
- Point-in-time timestamps use `@db.Timestamptz`; date-only fields use `@db.Date`.
- Foreign keys must prevent orphan records (`onDelete: Restrict`).
- Production migrations must be additive and backward-compatible (TSD 12.3).
- Do not run `prisma db push` in production.
