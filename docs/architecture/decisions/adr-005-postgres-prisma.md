# ADR-005: Use PostgreSQL 18 and Prisma ORM 7

- **Status**: Accepted
- **Decision Date**: 2026-10-04
- **Technical Decision ID**: TD-005

## Context
Workforce planning requires strict ACID guarantees, date interval overlapping calculations, composite relational constraints, and pessimistic row locking for allocation mutations.

## Decision
Use PostgreSQL 18 as the relational data store and Prisma ORM 7 for schema migrations, typed models, and transaction management. Raw SQL is restricted to parameterized operations where specialized row locking (`SELECT ... FOR UPDATE`) is mandatory.

## Consequences
- Strongly typed database client generated directly into `apps/api/src/generated/prisma`.
- Reproducible, automated database migrations version-controlled in Git.
