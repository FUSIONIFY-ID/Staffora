---
name: developer-pre-pr-checklist
description: Verify Staffora changes before opening a pull request into dev.
---

# Staffora Pre-PR Checklist

The Tech Lead (**Arya Isnaidi**) is the approving reviewer. Normal work targets `dev`; `main` is release-only.

## Required Verification Gate

Run from the repository root:
```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

## Rebase & Branch Requirements

1. Rebase branch on latest `dev`:
   ```bash
   git checkout dev
   git pull --rebase origin dev
   git checkout <your-branch>
   git rebase dev
   ```
2. Verify branch name follows `[FE/BE/DB/QA]-S<SprintNumber>-[Kode]-subjudultask`.
3. Self-review against `docs/CODE_REVIEW_CHECKLIST.md`.

## PR Self-Review Checklist

- [ ] User story (`USxx.xx`) and acceptance criteria (`ACxx.xx`) are in the PR description.
- [ ] Diff is strictly scoped; no `.env`, build artifacts (`dist/`), temporary logs, or credentials committed.
- [ ] All production files stay strictly under 300 lines.
- [ ] Server-side authorization and Capacity validation are enforced in backend.
- [ ] All 15 Mandatory Capacity Scenarios pass if allocation logic was touched.
- [ ] PR targets `dev` (never push directly to `dev` or `main`).
- [ ] CI pipeline is green before requesting review from Arya Isnaidi.
