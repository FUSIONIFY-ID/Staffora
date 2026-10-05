# Staffora Architecture Overview

Staffora is an internal **Project Resource Allocation & Workforce Planning System** built as a modular monolith in an npm Workspaces repository.

---

## 1. System Topology

```
+-------------------------------------------------------------+
|                     Browser / Desktop Client                |
|                    (Google Chrome / Edge)                   |
+-------------------------------------------------------------+
                              |
                     HTTPS / TLS (Port 443/80)
                              |
                              v
                 +--------------------------+
                 |       Nginx Ingress      |
                 +--------------------------+
                   /                       \
        Static Assets                      /api/v1 (Proxy)
                  /                          \
                 v                            v
  +---------------------------+  +-------------------------------+
  |   Staffora Web Client     |  |   Staffora Express API        |
  |   (React 19 + Vite 8 SPA) |  |   (Node.js 24 LTS, ESM)       |
  +---------------------------+  +-------------------------------+
                                              |
                                     Prisma ORM 7 + SQL
                                              |
                                              v
                                 +-------------------------------+
                                 |         PostgreSQL 18         |
                                 |  - Relational Models          |
                                 |  - user_sessions              |
                                 |  - Row-Level Locking          |
                                 +-------------------------------+
```

---

## 2. Monorepo Organization

- **`apps/web`**: Single Page Application built with React 19, TypeScript, Vite 8, React Router 7, Tailwind CSS 4, and TanStack Query 5.
- **`apps/api`**: REST API built with Node.js 24, Express 5, TypeScript ESM, Prisma ORM 7, and Zod 4.
- **`docs/`**: Version-controlled OpenAPI specification, database ERD/DBML, accepted ADRs, onboarding guides, and runbooks.

---

## 3. Domain Modules Boundaries

Backend features are organized into isolated domain modules:
1. **`identity`**: User accounts, login, logout, session persistence, role loading, CSRF token issuance.
2. **`workforce`**: Employee resource directory, department and job role taxonomy, resource profiles.
3. **`skills`**: Skill catalog management, employee skill assignments, and proficiency ratings (Level 1 to 5).
4. **`projects`**: Project lifecycle (`DRAFT`, `PLANNED`, `ACTIVE`, `COMPLETED`, `ARCHIVED`), Project Manager ownership enforcement.
5. **`staffing`**: Project staffing requirements, requested headcounts, capacity percentages, required skills.
6. **`allocations`**: Employee assignment to projects, lifecycle actions (create, edit, end, cancel), pessimistic concurrency protection.
7. **`capacity`**: Deterministic interval-based sweep-line calculation engine. Source of truth for all workload, availability, and conflict checking.
8. **`resource-finder`**: Filter-based resource matching by date range, role, skill proficiency, and remaining capacity.
9. **`dashboard`**: Role-scoped workforce summaries, capacity distribution, and project progress metrics.

---

## 4. Key Engineering Constraints

- **Authoritative Backend**: The backend is the sole source of truth for authorization, capacity calculation, and state mutations. Frontend validation is strictly for user feedback.
- **Inclusive Dates**: All dates (`YYYY-MM-DD`) are evaluated inclusively. A start date equal to an end date represents a valid single-day range.
- **No Over-allocation**: An employee's concurrent allocation must never exceed 100% on any date. Concurrent mutations are serialized via `SELECT ... FOR UPDATE` row locks.
- **Security Baseline**: Cookies (`staffora.sid`) are `HttpOnly` and `SameSite=Lax`. All state-changing endpoints require the `X-CSRF-Token` header.
