---
name: Review Changes
description: Perform a structured, risk-aware Staffora code review with evidence
---

# Review Changes

Review changes against the assigned task card, Staffora contracts, and operational risk. A green build is
necessary but does not prove authorization, data consistency, capacity locks, or acceptance-criterion behavior.

## Review Steps

1. Read `CLAUDE.md`, `docs/CODE_REVIEW_CHECKLIST.md`, the PR Task ID, linked User Story/ACs, and applicable docs.
2. Confirm branch follows standard naming: `[FE/BE/DB/QA]-S<SprintNumber>-[Kode]-subjudultask` and was rebased on `origin/dev`.
3. Inspect `git status`, `git diff --stat`, and focused diffs before forming conclusions.
4. Verify file lengths: every modified or added production file must strictly be under 300 lines.
5. Trace changed behavior through Web, API, Shared Schema, and Database contracts as applicable:
   - **API Envelopes:** Every endpoint returns `{ data, meta }` on success, or `{ error: { code, message, details } }` on failure.
   - **Authorization & Security:** Strict role-based permission checks; cookies are httpOnly, secure, sameSite=strict/lax; no exposed secrets.
   - **Capacity & Concurrency:** Any allocation mutation must acquire row-level lock (`SELECT ... FOR UPDATE`) inside an atomic transaction.
   - **Database & Migrations:** Forward-only Prisma migrations, foreign keys with indexes, no raw unsafe SQL.
   - **Frontend States:** Loading, empty, error, forbidden (403), and success states explicitly handled for all queries and mutations.
6. Check affected tests. Identify missing unit or integration tests by concrete behavior and acceptance criterion.
7. Run or inspect verification evidence:
   - `npm run lint`
   - `npm run typecheck`
   - `npm test`
   - `npm run build`
   Full verification is strictly required before Tech Lead Arya Isnaidi approves any PR into `dev`.

## Findings Format

Group findings by risk level:

- **High:** Release blocker, data corruption risk, bypassed capacity lock, broken auth/permission check, broken API contract, or unverified migration.
- **Medium:** Probable functional regression, missing critical test, file exceeding 300 lines limit, missing UI state (empty/error/403), or performance issue.
- **Low:** Maintainability, naming clarity, type refinement, or minor documentation improvement.

For each finding include:
- File path and line number link (`file:///...#Lxx`)
- Why it matters (impact on system or security)
- Concrete evidence (code snippet, log, or test output)
- Specific recommended remediation

End with one explicit recommendation:
- **Approve** (Ready for merge into `dev` by Tech Lead Arya Isnaidi)
- **Approve with Follow-up** (Non-blocking improvements logged as follow-up cards)
- **Request Changes** (Must be fixed and re-verified before merge)

## Optional Knowledge-Graph Tools

If `code-review-graph` is connected, begin with `get_minimal_context(task="<task>")` and use
`detail_level="minimal"`. Then use `detect_changes`, `get_affected_flows`, tests-for queries, and
`get_impact_radius` to focus review effort. Do not invent graph output when those tools are absent.

## Efficiency Rules

- Review the change and its direct dependencies before scanning unrelated code.
- Keep findings evidence-backed; do not report personal preferences as defects without a written project rule.
- Separate pre-existing issues from issues introduced by the reviewed change.
