# ADR-001: Use Modular Monolith Architecture

- **Status**: Accepted
- **Decision Date**: 2026-10-04
- **Technical Decision ID**: TD-001

## Context
Staffora is built by a team of 2 Frontend Engineers and 2 Backend Engineers across 4 development sprints. A distributed microservices architecture introduces significant operational complexity, distributed transaction hurdles (e.g. cross-service capacity checks), and network latency.

## Decision
Adopt a Modular Monolith architecture where:
- Backend runs as a single deployable Express.js application backed by a single PostgreSQL database.
- Internal logic is structured strictly by domain modules (`identity`, `workforce`, `skills`, `projects`, `staffing`, `allocations`, `capacity`, `resource-finder`, `dashboard`).
- Cross-domain calls go through module public service interfaces, not internal database repositories.

## Consequences
- **Positive**: Simplified database transactions, atomic capacity checks with row-level locks, simple local development and CI/CD pipelines.
- **Negative**: Requires strict discipline to prevent cyclic module dependencies and enforce repository encapsulation.
