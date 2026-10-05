# ADR-003: Use React 19 and Vite 8 for Frontend SPA

- **Status**: Accepted
- **Decision Date**: 2026-10-04
- **Technical Decision ID**: TD-003

## Context
Staffora is an internal enterprise tool deployed on corporate infrastructure. It has zero public SEO requirements, high interactivity requirements (capacity calendars, real-time workload sliders, interactive resource filter tables), and needs desktop-first ergonomics.

## Decision
Build `apps/web` as an internal Single Page Application (SPA) using React 19, Vite 8, TypeScript in strict mode, React Router 7, Tailwind CSS 4, and TanStack Query 5.

## Consequences
- Fast development reload and build times.
- Zero server-side rendering complexity or SSR hydration mismatches.
- Static assets can be efficiently served by Nginx with client-side routing.
