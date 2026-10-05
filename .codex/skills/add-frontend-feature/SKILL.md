---
name: add-frontend-feature
description: Build a React 19 / Vite 8 feature in Staffora with TanStack Query and role-aware navigation.
---

# Add a Staffora Frontend Feature

Staffora uses React 19, Vite 8, TypeScript strict mode, React Router 7, and Tailwind CSS 4. Features live under `apps/web/src/features/<feature>/`.

## Feature Architecture (TSD Section 6)

```text
apps/web/src/features/<feature>/
  <feature>-page.tsx       # Main feature page / screen component
  components/              # Sub-components specific to this feature
```

- Data fetching & server state: **TanStack Query 5** (`useQuery`, `useMutation`).
- Form handling & validation: **React Hook Form 7 + Zod 4**.
- Styling & Components: Reusable primitives from `apps/web/src/components/ui/` (`Button`, `Card`, `Badge`, `Modal`, `Alert`, `Input`, `Spinner`).
- State initialization: Pure initializers with `useState(() => ...)`.
- Wire routes into `apps/web/src/app/router/index.tsx` wrapped in `ProtectedRoute`.

## Workflow

1. Read the user story (`USxx.xx`), acceptance criteria (`ACxx.xx`), and permission matrix (PRD 2.2).
2. Use `apiClient` from `apps/web/src/api/client.ts` (automatically handles session cookie and `X-CSRF-Token`).
3. Handle all 5 mandatory UI states:
   - **Loading**: Skeleton or `<Spinner />`.
   - **Empty**: Informative empty state message.
   - **Error**: `<Alert type="error" />` displaying server message.
   - **Forbidden**: Explicit 403 screen per TSD 6.4 (never disguise as empty data).
   - **Success**: Immediate invalidation of affected query keys (`projects`, `employees`, `allocations`, `capacity`, `dashboard`).
4. Keep production files under 300 lines (proactively split at 250 lines).
5. Add component tests in `apps/web/tests/`.
6. Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Checklist

- [ ] Route is registered in `AppRouter` and protected by `ProtectedRoute` with correct `allowedRoles`.
- [ ] Navigation link visibility matches current authenticated user role.
- [ ] Direct navigation to unauthorized route renders explicit 403 Forbidden state.
- [ ] Mutation invalidates affected TanStack Query caches.
- [ ] Desktop-first layout optimized for 1440px and fully usable down to 1280px.
- [ ] No `any`, no `@ts-ignore`, no raw `fetch` calls.
