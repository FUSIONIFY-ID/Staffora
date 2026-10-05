# ADR-008: Use GitHub Actions and GitHub Container Registry (GHCR)

- **Status**: Accepted
- **Decision Date**: 2026-10-04
- **Technical Decision ID**: TD-008

## Context
Code repository, issues, pull requests, and automated testing reside in GitHub. A consolidated toolchain minimizes third-party service dependencies.

## Decision
Use GitHub Actions for CI (lint, typecheck, unit/integration test, build, disposable database migration test) and build multi-stage Docker images pushed to GitHub Container Registry (GHCR) for staging and production deployments.

## Consequences
- Continuous verification on every pull request prior to merge.
- Immutable container images tagged by commit SHA and semantic version tags.
