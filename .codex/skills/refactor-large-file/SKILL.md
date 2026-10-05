---
name: refactor-large-file
description: Split an oversized source file in Staffora adhering to the strict 300-line limit.
---

# Refactor Large Files (Strict 300-Line Limit)

Per `docs/CODING_STANDARD.md`, **no production file in Staffora may exceed 300 lines**. Proactively split files when they reach **250 lines**.

## Protocol

1. Record current behavior and verify existing tests pass: `npm test`.
2. Identify cohesive boundaries to extract:
   - In Backend: Extract sub-schemas, helpers, specialized repository queries, or domain calculation sub-routines into separate focused files.
   - In Frontend: Extract modal forms, table sub-views, header toolbars, or custom query hooks into `features/<feature>/components/` or `hooks/`.
3. Preserve existing public service interfaces, API envelopes, and route contracts.
4. Verify TypeScript strict mode compatibility: `npm run typecheck`.
5. Run full verification: `npm run lint`, `npm test`, `npm run build`.
