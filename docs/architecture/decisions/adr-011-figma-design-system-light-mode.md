# ADR-011: Adopt the Figma design system and ship light mode only

- **Status**: Accepted
- **Decision Date**: 2026-10-13
- **Technical Decision ID**: TD-011
- **Supersedes**: the dark theme (`#0a0f1d`) rule in `docs/development/coding-conventions.md` section 4 and `docs/CODE_REVIEW_CHECKLIST.md` section "UI Behavior & Design System"

## Context

Staffora has two conflicting visual sources.

`docs/development/coding-conventions.md` specified a dark theme with `#0a0f1d` as the page background, and `docs/CODE_REVIEW_CHECKLIST.md` enforced that rule on every pull request. Those documents were written during the repository foundation, before any design reference existed.

The approved design reference is the Figma file "Staffora — Product Design & Prototype (MVP v1.0)", which covers 19 screens. Every screen in it is light: page `#F7F8FA`, surfaces `#FFFFFF`, borders `#E5E7EB`, text `#171717` / `#525252` / `#737373`, primary `#2563EB`, and the typeface is Exo 2. The only dark surface in the whole file is the login brand panel at `#111827`.

Because the code followed the documents and the documents disagreed with the design, the first implementation of the application shell shipped dark. The Tech Lead confirmed on 2026-10-13 that the design reference takes precedence and that the MVP ships light only, with no dark mode.

## Decision

1. The Figma file "Staffora — Product Design & Prototype (MVP v1.0)" is the visual source of truth for `apps/web`.
2. The MVP ships **light mode only**. No dark mode, no theme switch, no `prefers-color-scheme` handling.
3. Design tokens are recorded in `docs/ui-specs/design-system/design-system.md` and `design-system.json`. Each value carries a confidence marker: `EXACT` from Figma metadata, `INFERRED` from repeated patterns, `ESTIMATED` from measurement, `UNKNOWN` where the source cannot prove it.
4. Tokens are declared once through Tailwind's `@theme` in `apps/web/src/index.css` and consumed as utilities. Components do not write hex literals for colours that a token already defines.
5. `docs/development/coding-conventions.md` and `docs/CODE_REVIEW_CHECKLIST.md` reference this ADR instead of naming a theme of their own.

## Consequences

- A reviewer no longer has to choose between the checklist and the design; the design wins and both documents say so.
- Changing a colour or size is a one-line change in `index.css`.
- The light theme depends on the token layer being used. A component that hard-codes a hex value bypasses it, so the sweep of existing literals has to be maintained as new components are added.
- Dark mode is out of scope. Adding it later means introducing a theme switch and a second token set, not just inverting values.
- The design file carries no tablet or mobile frame, and PRD 17.3 excludes mobile from the MVP, so no breakpoint below 1280px is defined. Responsive behaviour below 1280px is `UNKNOWN` until a design provides it.

## Alternatives considered

- **Keep dark and treat the design as aspirational.** Rejected: the design is the approved deliverable, and the shell is the frame every screen inherits, so the mismatch would repeat on every later screen.
- **Support both themes now.** Rejected: no dark design exists, so a dark theme would be invented rather than derived, and it doubles the review surface for no Sprint 1 value.
- **Leave the documents alone and follow the design in code only.** Rejected: the checklist is enforced, so the next reviewer would flag the light theme as a violation.
