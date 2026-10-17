# Round 3 — review response, app shell

| Item | Value |
| --- | --- |
| Mode | `review-response` |
| Trigger | `aryanibos` `CHANGES_REQUESTED` on PR #11 at 2026-10-14T18:04:35Z, 24 findings (F1–F24) |
| Reviewed revision | `e0526f1` |
| Reference | Figma — Staffora — Product Design & Prototype (MVP v1.0), frames `01 — Login`, `02 — Main App Shell`, `18 — 403 Access Denied`, `19 — 404 Not Found` |
| Implementation | `FE-S1-US02-main-app-shell` |
| Environment | Local dev, Vite dev server on 5295, Express API on 3144, migrated and seeded PostgreSQL |
| Viewports | 1440x900 and 1280x800 |
| Evidence | `01-dashboard-breadcrumb-1440.png` … `05-employee-403-1440.png` in this directory |

## Why this round exists

Round 2 recorded the response to the first review and was itself reviewed. That
review confirmed thirteen findings as resolved and raised a regression plus five
new items, so this round records the code fixes and the measurements for them.
`round-1/` and `round-2/` are unchanged, except that `round-2.md` now cites the
revision its screenshots actually came from.

## What changed

| Finding | Severity | Change |
| --- | --- | --- |
| F17 | P2 | Breadcrumbs are built from `PRIMARY_NAV` before `NAV_GROUPS`. Overview moved out of the groups in round 2, so `buildBreadcrumbs('/dashboard')` had been returning an empty trail. |
| F7 | P2 | The page footer that the reference does not show is gone from `app-layout.tsx`. |
| F19 | P2 | `logo.png` and `logo-icon.png` are restored. They were deleted here while `dev`, `FE-S1-US01-login-screen` and `FE-S1-US06-overview-my-profile-search` still reference them, which is what turned the deletion into a modify/delete conflict. `logo-mono.png` and `icons.svg` stay deleted: no branch references either. |
| F18 | P2 | `round-2.md` now cites `bac6dfa`, the revision its screenshots were taken from. |
| F20 | P3 | The ADR-011 link in `CODE_REVIEW_CHECKLIST.md` is now relative to `docs/`, where the checklist lives. |
| F21 | P3 | The sidebar avatar shows one initial per word (`CA` for Chief Administrator, `AI` for Arya Isnaidi) instead of the first two characters of the first word, and the second line shows the role label instead of the email, matching frame 02. |
| F23 | P3 | The console claim is stated precisely in `round-2.md`: the only failed requests are the `/auth/me` and `/auth/csrf-token` session probes, which answer 401 until a session exists. |
| F24 | P3 | `auth-ui.test.tsx` no longer contains a password literal or an `as HTMLInputElement` cast; it asserts the login form offers exactly one submit control. |

`ROLE_LABELS` moved from `permission-denied.tsx` to `app/roles.ts` so the 403
card and the sidebar read the same map, with `initialsOf` beside it.

## Measurements

| Element | Reference | Implementation | Result |
| --- | --- | --- | --- |
| Breadcrumb on `/dashboard` | `Overview` | 1 crumb, text `Overview`, `aria-current="page"` | Match |
| Breadcrumb on `/capacity` | `Workforce / Capacity` | 2 crumbs, `Workforce` then `Capacity` | Match |
| Breadcrumb on `/my-profile` | `My Workspace / My Profile` | 2 crumbs | Match |
| Sidebar user block | avatar, name, role | `CA`, `Chief Administrator`, `Admin` | Match |
| Sidebar user block, Employee | avatar, name, role | `RP`, `Rian Pratama`, `Employee` | Match |
| Page footer | not in the reference | not rendered (`footer` count 0, no `MVP v1.0` text) | Match |
| Sidebar width | 240px | 240px at 1440 and at 1280 | Match |
| 404 card | 640px, two actions | 640px, `Go to Home` and `Go Back` | Match |
| 403 card | 640px | 640px, `Back to My Profile`, `Required: Admin` | Match |
| Horizontal overflow at 1280 | none | `scrollWidth` 1280 | Match |

## Beyond the findings

While checking the deletion of the logo assets (F19) the reference count was
measured across branches rather than assumed:

| Asset | Referenced by | Kept |
| --- | --- | --- |
| `logo.png` | `dev` (`app-layout.tsx`), `FE-S1-US01-login-screen` | yes |
| `logo-icon.png` | `dev` (`login-page.tsx`), `FE-S1-US06-…` (`app-layout.tsx`, `login-page.tsx`) | yes |
| `logo-mono.png` | no branch | deleted |
| `icons.svg` | no branch | deleted |

## How to reproduce

```bash
npm run stack:up          # or: npm run dev:api and npm run dev:web
npm test -w @staffora/web
```

Then sign in as `admin@staffora.internal` and open `/dashboard`: the header shows
the `Overview` crumb. Open `/my-profile` and check the avatar and the line under
the name. There is no footer on any page.

## Confidence

Layout values and crumb counts are read from the running page, so they are
`EXACT`. The footer removal is verified by counting `footer` elements and by the
absence of the `MVP v1.0` string in the rendered text.

## Not compared

No tablet or mobile frame exists in the design, and PRD 17.3 excludes mobile from
the MVP, so no breakpoint below 1280 was compared.

## Open items for the Tech Lead

Unchanged from round 2, plus the theme heading below:

| Item | Detail |
| --- | --- |
| F2 | Confirm the `/my-profile` role matrix against PRD 2.2. The repo has no PRD, and round 1 quoted a matrix that says Employee only. |
| F4 | Merge order for PR #9 and PR #11. |
| F5 | Story and AC for the shell card; commits cannot carry `USxx.xx - ACxx.xx` without them. |
| F7 | Whether the header search field and notification glyph are out of scope for this card. |
| F11 | The PR body is not in the repo; it needs a Tech Lead read. |
| F22 | The "Ready for Sprint 1" badge and the "siap diimplementasikan" copy are placeholders on nine pages. Removing them changes pages owned by other cards, and the copy language rule lives in the PRD, which is not in the repo. |
| ADR-011 | The ADR records itself as Accepted on the basis of a verbal Tech Lead decision. It needs a signature on the PR. |
| Favicon | `favicon.svg` is a monogram "S" on `#111827`. The design has no favicon frame, so the mark is derived from the brand block rather than copied; it needs design sign-off. |
