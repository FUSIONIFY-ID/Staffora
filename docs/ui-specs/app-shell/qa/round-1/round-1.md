# Round 1 — design comparison, app shell

| Item | Value |
| --- | --- |
| Mode | `compare` |
| Reference | Figma — Staffora — Product Design & Prototype (MVP v1.0), frames `01 — Login`, `02 — Main App Shell`, `18 — 403 Access Denied`, `19 — 404 Not Found` |
| Implementation | `FE-S1-US02-main-app-shell`, commit `7db1c45` |
| Environment | Local dev, Vite dev server, API on a migrated and seeded PostgreSQL |
| Viewports | 1440x900 and 1280x800 |
| Evidence | `01-login-1440.png` … `06-employee-shell-1280.png` in this directory |

## Why this round exists

The first implementation used a dark theme because `docs/development/coding-conventions.md` line 53 specified dark `#0a0f1d`. The design reference is light. The Tech Lead confirmed on 2026-10-13 that Figma is the visual source of truth and that the MVP ships light only, so this round records the conversion and checks it against the design.

## Composition

| Element | Reference | Implementation | Result |
| --- | --- | --- | --- |
| Page background | `#F7F8FA` | `rgb(247, 248, 250)` | Match |
| Sidebar width | 240px | 240px at 1440 and at 1280 | Match |
| Sidebar fill and border | `#FFFFFF`, `1px #E5E7EB` | white, `#E5E7EB` | Match |
| Header height | 72px | 72px | Match |
| Content gutter | 36px | 36px | Match |
| Content width at 1440 | 1128px | 1128px | Match |
| Typography | Exo 2, weights 400/500/600 | `"Exo 2", system-ui, ...` | Match |
| Primary action | `#2563EB` | `#2563EB` | Match |
| Login layout | 680px brand panel `#111827` plus a 420px card | panel 680px, card 420px, radius 14px | Match |
| 403 card | 640px card, 112px badge on `#FEF2F2` | card 640px, badge 112px, `#FEF2F2`, text `#DC2626` | Match |
| 404 card | 640px card, 112px badge on `#EFF6FF` | card 640px, badge 112px, `#EFF6FF`, text `#2563EB` | Match |

## Navigation and role visibility

| Role | Reference | Implementation | Result |
| --- | --- | --- | --- |
| Admin | Overview, Workforce, Projects, My Workspace, Administration | `/dashboard`, `/resources`, `/skills`, `/capacity`, `/projects`, `/allocations`, `/admin/users`; My Workspace omitted because it has no item for Admin | Match |
| Employee | Projects and My Profile only | redirected to `/my-profile`, menu shows `/projects` and `/my-profile` | Match |

## Mismatches found and their status

| Priority | Finding | Status |
| --- | --- | --- |
| High | Dark theme throughout, against a light design | Fixed in `7db1c45` |
| Medium | Sidebar 256px at `xl` instead of 240px | Fixed |
| Medium | Content gutter 32px instead of 36px | Fixed |
| Medium | Font `Plus Jakarta Sans` instead of `Exo 2` | Fixed |
| Medium | 403 and 404 rendered as an inline `Alert`, not the designed card | Fixed |
| Low | Header height 64px instead of 72px | Fixed |

No mismatch remains open at Critical or High.

## Deliberate differences

The design shows no quick sign-in buttons on the login screen. The implementation keeps them for local testing against seeded accounts. They are an implementation addition, not a design element, and they do not alter the designed layout.

The 403 frame writes "Required: Admin / Resource Manager" while the `/admin/users` route in this repository allows `ADMIN` only. The component prints the roles the route actually requires, so it reads "Required: Admin". The design sample and the route disagree; the route is treated as authoritative and the difference is recorded here for confirmation.

## Confidence

Measurements come from Figma node metadata, so they are `EXACT`. Colours read back from the running page through `getComputedStyle` are exact for the implementation side. Hover, focus, active and disabled states are `UNKNOWN`: the design has no interaction frames, so no state was compared.

## Not compared

No tablet or mobile frame exists in the design, and PRD 17.3 excludes mobile from the MVP, so no breakpoint below 1280 was compared and none was invented.

## How to reproduce

```bash
npm run stack:up          # or: npm run dev:api and npm run dev:web
npm test -w @staffora/web
```

Then open `/login`, sign in as `admin@staffora.internal`, and check the sidebar and header at 1440. Sign in as `employee@staffora.internal` and open `/admin/users` directly to reach the 403 card.
