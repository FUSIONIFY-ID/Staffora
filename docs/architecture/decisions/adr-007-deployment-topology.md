# ADR-007: Nginx and Docker Compose on Single Linux VM for MVP

- **Status**: Accepted
- **Decision Date**: 2026-10-04
- **Technical Decision ID**: TD-007

## Context
Staffora MVP is designed for internal company usage (up to 500 employees, 100 active projects). Heavy orchestration (Kubernetes) introduces unnecessary maintenance overhead for 4 sprints.

## Decision
Deploy via Docker Compose on a single Linux VM:
- Container 1: Nginx (serves built React SPA static files, reverse proxies `/api/v1` to API container, terminates TLS).
- Container 2: Node.js Express REST API.
- Container 3: PostgreSQL 18 with persistent Docker volume.

## Consequences
- Single-command local environment identical to staging/production topology.
- Straightforward backup and restore runbooks using standard `pg_dump`.
