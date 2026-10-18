# Staffora Design System

Implementation contract derived from the approved design reference.

| Item             | Value                                                                                |
| ---------------- | ------------------------------------------------------------------------------------ |
| Source           | Figma — Staffora — Product Design & Prototype (MVP v1.0)                             |
| Mode             | `system`                                                                             |
| Screens analysed | 19                                                                                   |
| Decision         | Arya Isnaidi (Tech Lead), 2026-10-13: the design reference is Figma, light mode only |
| Supersedes       | `docs/development/coding-conventions.md` section 4, which specified dark `#0a0f1d`   |

Confidence markers: **EXACT** from Figma metadata, **INFERRED** from repeated patterns, **ESTIMATED** from measurement, **UNKNOWN** where the source cannot prove a value.

## Layout

| Token                 | Value  | Confidence |
| --------------------- | ------ | ---------- |
| Design width          | 1440px | EXACT      |
| Sidebar               | 240px  | EXACT      |
| Header                | 72px   | EXACT      |
| Content gutter        | 36px   | EXACT      |
| Content width at 1440 | 1128px | EXACT      |
| Minimum usable        | 1280px | EXACT      |

Content width is derived: `1440 − 240 − 36 − 36 = 1128`. Frame 02 labels these directly as `Desktop 1440`, `Sidebar 240`, and `Header 72`.

## Colour

Light surfaces. The only dark surface in the whole design is the login brand panel.

| Token                  | Value                             | Use                                         |
| ---------------------- | --------------------------------- | ------------------------------------------- |
| `surface-page`         | `#F7F8FA`                         | App background                              |
| `surface-white`        | `#FFFFFF`                         | Cards, tables, sidebar, header              |
| `surface-table-header` | `#FAFAFA`                         | Table header row                            |
| `surface-chip`         | `#F5F5F5`                         | Neutral chip, filter pill                   |
| `surface-divider`      | `#F0F0F0`                         | Table row divider                           |
| `surface-brand-panel`  | `#111827`                         | Login brand panel only                      |
| `primary`              | `#2563EB`                         | Primary button, active nav, links, progress |
| `text-primary`         | `#171717`                         | Page titles, card values                    |
| `text-secondary`       | `#525252`                         | Table cells, body copy                      |
| `text-muted`           | `#737373`                         | Subtitles, breadcrumb, table header labels  |
| `text-placeholder`     | `#A3A3A3`                         | Placeholder, footnote                       |
| `border-default`       | `#E5E7EB`                         | Card, table, container                      |
| `border-input`         | `#D4D4D4`                         | Form field                                  |
| `success`              | `#16A34A` / `#DCFCE7` / `#166534` | Fulfilled, active chip                      |
| `warning`              | `#D97706` / `#FEF3C7`             | Partially filled                            |
| `danger`               | `#DC2626` / `#FEE2E2` / `#991B1B` | Fully allocated, 403 badge                  |
| `info`                 | `#EFF6FF` / `#1D4ED8` / `#BFDBFE` | Note panel, active nav fill                 |

## Typography

Font is **Exo 2** at weights 400, 500, and 600. Every text style in the file uses it.

| Token           | Size / line | Weight |
| --------------- | ----------- | ------ |
| `display`       | 32 / 46     | 600    |
| `badge-hero`    | 30 / 44     | 600    |
| `page-title`    | 28 / 41     | 600    |
| `section-title` | 24 / 35     | 600    |
| `metric`        | 22 / 32     | 600    |
| `card-title`    | 20 / 29     | 600    |
| `card-heading`  | 17 / 25     | 600    |
| `body`          | 14 / 20     | 400    |
| `button`        | 14 / 20     | 600    |
| `body-sm`       | 13 / 19     | 400    |
| `label`         | 12 / 17     | 500    |
| `table-header`  | 12 / 17     | 600    |
| `chip`          | 11 / 16     | 500    |
| `footnote`      | 11 / 16     | 400    |

## Radius and controls

| Element              | Value                |
| -------------------- | -------------------- |
| Button, field        | 8px                  |
| Card                 | 10px                 |
| Content canvas       | 12px                 |
| Login card           | 14px                 |
| Chip, progress track | 999px                |
| Field height         | 40px                 |
| Button padding       | `10px 16px`, gap 8px |
| Table header / row   | 46px / 48px          |
| Progress track       | 8px tall             |

## Components

- **Button primary**: `#2563EB` fill, white text, 8px radius, `10px 16px` padding.
- **Button secondary**: white fill, `1px #E5E7EB` border, `#171717` text.
- **Field**: white fill, `1px #D4D4D4` border, 40px tall, 8px radius, placeholder `#A3A3A3`.
- **Card**: white fill, `1px #E5E7EB` border, 10px radius, 20px padding.
- **Data table**: `#FAFAFA` header, 46px header row, 48px body rows, `1px #F0F0F0` dividers.
- **Status chip**: pill radius, `4px 10px` padding, success/neutral/warning/danger/info variants.
- **Progress bar**: 8px track, `#E5E7EB` rail, fill green/blue/amber/red by band.
- **Note panel**: `#EFF6FF` fill, `1px #BFDBFE` border, `#1D4ED8` text.

## State screens

**403 Access Denied** (frame 18): 640px card, 112px circular badge on `#FEF2F2` with `#DC2626` "403", title "Access denied", a role-context panel on `#F8FAFC`, and a "Back to Dashboard" primary action.

**404 Not Found** (frame 19): 640px card, 112px circular badge on `#EFF6FF` with `#2563EB` "404", title "Page not found", and two actions, "Go to Dashboard" primary and "Go Back" secondary.

## Login

Two columns at 1440: a 680px brand panel on `#111827` carrying "Staffora" and "Right People. Right Project.", then a 420×520 card at 14px radius holding the Work email and Password fields and a 48px submit.

The design has no quick sign-in buttons. The seeded-account shortcut in the current build is an implementation addition for local testing, not a design element.

## Ambiguities

| Topic                          | Confidence | Note                                                |
| ------------------------------ | ---------- | --------------------------------------------------- |
| Hover, focus, active, disabled | UNKNOWN    | Static frames; no interaction state depicted        |
| Breakpoints below 1280         | UNKNOWN    | No tablet or mobile frame; PRD 17.3 excludes mobile |
| Shadows                        | UNKNOWN    | Cards use a 1px border, not elevation               |
| Icon set                       | UNKNOWN    | Icons appear as text glyphs; no library named       |

## Implementation guidance

- Light mode only. No theme switch in MVP.
- Define the tokens as CSS custom properties in `apps/web/src/index.css` so component classes stay utility-only.
- Keep the sidebar at 240px and the header at 72px; the 1440 composition depends on both.
- Use a 36px page gutter rather than Tailwind's default 32px.
- Prefer flex and grid with gaps. The Figma frames use absolute coordinates because they are static exports, not because the implementation should.
- Reuse the primitives already in `apps/web/src/components/ui/`. Do not add a second component set.
- `#A3A3A3` is placeholder-only; it must not carry essential text.
