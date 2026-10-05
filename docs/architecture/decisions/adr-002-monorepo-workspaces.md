# ADR-002: Use Monorepo with npm Workspaces

- **Status**: Accepted
- **Decision Date**: 2026-10-04
- **Technical Decision ID**: TD-002

## Context
Full-stack development for Staffora requires rapid iteration across the React web app, Express REST API, shared OpenAPI contracts, and operational documentation. Multiple repositories cause version fragmentation and multi-PR synchronization delays.

## Decision
Use a single monorepo governed by native npm Workspaces:
- `apps/web`: React 19 SPA.
- `apps/api`: Express.js 5 REST API.
- `docs/`: OpenAPI contract, ERD/DBML, ADRs, setup guides, and runbooks.
- Disallow direct file imports between `apps/web` and `apps/api/src`. API contracts are shared strictly via OpenAPI and generated TypeScript types.

## Consequences
- Single unified pull request can encompass UI, backend endpoints, schema migrations, and documentation updates.
- Central lockfile `package-lock.json` ensures reproducible dependency versions across developers and CI.
