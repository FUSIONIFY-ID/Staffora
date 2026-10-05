# ADR-006: PostgreSQL-Backed Server-Side Cookie Session

- **Status**: Accepted
- **Decision Date**: 2026-10-04
- **Technical Decision ID**: TD-006

## Context
Stateless JWT tokens stored in browser localStorage are susceptible to XSS token theft and cannot be instantaneously revoked upon employee deactivation or logout without complex token blocklists.

## Decision
Use stateful server-side sessions via `express-session` with `connect-pg-simple` stored in the `user_sessions` PostgreSQL table:
- Cookie name: `staffora.sid`
- Cookie flags: `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure=true` (in staging/production)
- Session inactivity timeout: 8 hours rolling
- Session fixation protection: Regenerate session ID upon successful login
- Synchronizer token pattern for CSRF defense on state-changing operations (`X-CSRF-Token`).

## Consequences
- Revocation is immediate by destroying the session row in PostgreSQL.
- Inactive users are instantly rejected on their next request.
- Frontend JavaScript has zero access to raw session credentials.
