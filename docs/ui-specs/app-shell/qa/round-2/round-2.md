# Round 2 — review response, app shell

| Item              | Value                                                                                                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mode              | `review-response`                                                                                                                                    |
| Trigger           | `aryanibos` `CHANGES_REQUESTED` on PR #11 at 2026-10-13T16:50:30Z, 16 findings (F1–F16)                                                              |
| Reviewed revision | `bac6dfa`                                                                                                                                            |
| Reference         | Figma — Staffora — Product Design & Prototype (MVP v1.0), frames `01 — Login`, `02 — Main App Shell`, `18 — 403 Access Denied`, `19 — 404 Not Found` |
| Implementation    | `FE-S1-US02-main-app-shell`                                                                                                                          |
| Environment       | Local dev, Vite dev server on 5295, Express API on 3144, migrated and seeded PostgreSQL                                                              |
| Viewports         | 1440x900 and 1280x800                                                                                                                                |
| Evidence          | `01-login-1440.png` … `08-employee-profile-1280.png` in this directory                                                                               |

## Why this round exists

Round 1 recorded the dark-to-light conversion against the design. The Tech Lead then reviewed the
implementation and returned 16 findings. This round records what was changed for each one and
re-verifies the result on the running application. `round-1/` is unchanged and still applies to
`7db1c45`.

## Findings and resolutions

| ID  | Sev | Finding                                                       | Resolution                                                                                                                                                                                                                                                            |
| --- | --- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | P1  | Seed passwords shipped in the production bundle               | Quick Sign-in block deleted from `login-page.tsx`. Production bundle scan for `StafforaAdmin2026`, `StafforaPM2026`, `StafforaRM2026`, `StafforaEmp2026` and `Quick Sign-in` returns 0 files.                                                                         |
| F2  | P2  | `/my-profile` guard and menu disagreed                        | `My Profile` moved to `ALL_ROLES` in `nav-config.ts`, matching the route guard. Frame 02 shows the full menu including Administration next to My Profile, so the designed user is an Admin and My Profile is not Employee-only. Needs Tech Lead confirmation.         |
| F3  | P2  | No test covered the route guards                              | `tests/router-guards.test.tsx` added; it renders the real `AppRouter`. Mutation check: forcing the role check off makes 2 tests fail, previously 0.                                                                                                                   |
| F4  | P2  | Overlap with PR #9 in 4 files                                 | Not resolved here — merge order is a Tech Lead decision.                                                                                                                                                                                                              |
| F5  | P2  | Commits carry no `[USxx.xx - ACxx.xx]`                        | Not resolved here — the shell card has no user story or AC. Tech Lead decision.                                                                                                                                                                                       |
| F6  | P2  | `CODE_REVIEW_CHECKLIST.md` still required the dark theme      | Line 108 updated; `docs/architecture/decisions/adr-011-figma-design-system-light-mode.md` added.                                                                                                                                                                      |
| F7  | P2  | Sidebar and header structure differed from frame 02           | Overview is a top-level item, the sidebar carries the wordmark and the footer user block, and the groups match the frame. The header search field and the notification glyph are **not** implemented; see Open items.                                                 |
| F8  | P2  | Opaque white logo unreadable                                  | All raster logos removed. The Figma file contains no IMAGE node, so the brand is text. Sidebar and login panel render text.                                                                                                                                           |
| F9  | P2  | 202 hex literals across 27 files                              | `index.css` declares every token through Tailwind `@theme`. No hex literal remains in `apps/web/src` outside `index.css`; the single remaining occurrence is inside a comment in `login-page.tsx`.                                                                    |
| F10 | P2  | Dashboard showed hardcoded live status                        | Rewritten to render auth-context values plus `EmptyState`. The "PostgreSQL 18", session-status and version strings are gone.                                                                                                                                          |
| F11 | P2  | PR body not tied to a revision                                | Round 2 fixes the PR body; see the review reply.                                                                                                                                                                                                                      |
| F12 | P2  | Dead code and unreachable branches                            | `app-layout.tsx` unreachable branches removed; all nine scaffold pages now consume `PageHeader` and `EmptyState`, so the two shared components are no longer near-dead.                                                                                               |
| F13 | P2  | Unsafe `as` casts                                             | Replaced with `instanceof` narrowing.                                                                                                                                                                                                                                 |
| F14 | P2  | Error boundary stayed mounted across routes                   | `<ErrorBoundary key={pathname}>`.                                                                                                                                                                                                                                     |
| F15 | P3  | 2.41:1 contrast on the 403 role label                         | `text-ink-muted` replaces the literal.                                                                                                                                                                                                                                |
| F16 | P3  | Misc: nested interactive elements, heading order, inert props | Nested `<Link><Button>` removed in three places; `EmptyState` gained `headingLevel` and every page now runs h1 to h2; the inert `glow` prop was removed from `Card`; `badge` `purple` no longer duplicates `blue`; a declared favicon removes the `/favicon.ico` 404. |

## Composition re-check

| Element           | Reference                 | Implementation                                          | Result |
| ----------------- | ------------------------- | ------------------------------------------------------- | ------ |
| Sidebar width     | 240px                     | 240px at 1440 and at 1280                               | Match  |
| Header height     | 72px                      | 72px                                                    | Match  |
| 403 card          | 640px card, 112px badge   | card 640px, badge 112x112                               | Match  |
| 404 card          | 640px card                | card 640px                                              | Match  |
| Login brand panel | 680px `#111827`           | 680px `#111827`                                         | Match  |
| Brand mark        | text only, no image node  | text only                                               | Match  |
| Admin role chip   | distinct from other roles | violet, no longer identical to the Project Manager chip | Match  |

## Heading order

| Page                  | Before         | After          |
| --------------------- | -------------- | -------------- |
| Scaffold pages (nine) | `h1` then `h3` | `h1` then `h2` |
| 403                   | `h1` then `h3` | `h1` then `h2` |
| 404                   | `h1`           | `h1`           |

## Console

No console error is emitted on any page in this round, with one deliberate
exception: while the visitor has no session, the app probes `GET /api/v1/auth/me`
and `GET /api/v1/auth/csrf-token` and the API answers `401`. The browser records
those as failed requests. They are the session check working as designed, not a
fault in a page, and they stop once a session exists.

The `/favicon.ico` 404 from round 1 is gone because `index.html` now declares
`/favicon.svg`.

## Open items for the Tech Lead

| Item               | Detail                                                                                                                                                                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F4 merge order     | PR #9 and PR #11 conflict in `app/router/index.tsx`, `app/router/protected-route.tsx`, `features/auth/login-page.tsx` and `index.css`.                                                                                                                                    |
| F5 story and AC    | The shell card carries no `USxx.xx` / `ACxx.xx`, so the commit trailer cannot be completed.                                                                                                                                                                               |
| F7 header          | Frame 02 shows a global search field and a notification glyph. Global search needs a cross-entity query endpoint that no Sprint 1 card provides; the glyph has no data source. Neither was rendered, because an inert control would present non-functional UI as working. |
| F2 scope           | Confirm My Profile is available to all four roles.                                                                                                                                                                                                                        |
| F7b                | Frame 18 writes "Required: Admin / Resource Manager" while `/admin/users` allows `ADMIN` only; the card prints the route's actual roles.                                                                                                                                  |
| Employee dashboard | Whether an Employee may reach `/dashboard`; PRD 2.2 places the personal dashboard at US06.02 in Sprint 4.                                                                                                                                                                 |

## Confidence

Layout measurements are read from the running page, so they are `EXACT`. The F1 bundle scan and the
F3 mutation check are reproducible commands, recorded in the review reply. Hover, focus, active and
disabled states remain `UNKNOWN`: the design has no interaction frames.

## How to reproduce

```bash
npm run stack:up          # or: npm run dev:api and npm run dev:web
npm test -w @staffora/web
npm run build -w @staffora/web && grep -rl StafforaAdmin2026 apps/web/dist   # expect no output
```

Then open `/login` — there is no Quick Sign-in block. Sign in as `admin@staffora.internal` and check
the sidebar and header at 1440. Sign in as `employee@staffora.internal` and open `/admin/users`
directly to reach the 403 card, then open any unknown path for the 404 card.
