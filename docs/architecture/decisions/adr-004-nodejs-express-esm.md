# ADR-004: Use Node.js 24 LTS and Express.js 5 with ESM

- **Status**: Accepted
- **Decision Date**: 2026-10-04
- **Technical Decision ID**: TD-004

## Context
The backend API requires stability, long-term support, standard asynchronous programming, and clean modular boundary organization.

## Decision
Use Node.js 24 LTS runtime with Express.js 5, TypeScript strict mode, and native ECMAScript Modules (`"type": "module"`). Domain modules adhere to a standard directory convention:
`routes.ts` -> `controller.ts` -> `service.ts` -> `repository.ts`, guarded by `schema.ts` and `policy.ts`.

## Consequences
- Express 5 brings native Promise rejection handling in middleware and route handlers without needing `express-async-errors`.
- Modern ESM standard aligns across the entire codebase.
