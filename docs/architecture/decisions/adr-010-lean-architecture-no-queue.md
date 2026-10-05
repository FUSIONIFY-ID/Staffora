# ADR-010: Lean Architecture — Exclude Redis, Background Queues, and Object Storage from MVP

- **Status**: Accepted
- **Decision Date**: 2026-10-04
- **Technical Decision ID**: TD-010

## Context
Adding external brokers (Redis, RabbitMQ, S3/MinIO) adds operational overhead, failure modes, and deployment prerequisites without delivering core MVP value for Staffora's workforce planning capabilities.

## Decision
For MVP v1.0:
- Session management is handled directly via PostgreSQL table `user_sessions`.
- Allocation status calculation (`PLANNED`, `ACTIVE`, `ENDED`, `CANCELLED`) is computed dynamically based on current date and stored `cancelled_at` timestamps without requiring scheduled cron jobs.
- File uploads are not in scope for MVP; user avatars/documents are not stored.
- Audit history is stored directly on mutable business tables (`created_at`, `created_by`, `updated_at`, `updated_by`, `cancelled_at`, `cancelled_by`).

## Consequences
- Single database dependency simplifies backup, restore, local development, and hosting.
- Ready for future expansion to Redis or message queues if workload demands evolve past MVP scale.
