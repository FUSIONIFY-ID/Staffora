-- Normalised, case-insensitive uniqueness for master-data names (ERD 2.3:
-- "name: Unique constraint (case-insensitive/normalized)").
--
-- PostgreSQL has no case-insensitive UNIQUE constraint, so the rule is enforced
-- with a unique index over lower(name). Prisma cannot model an expression index,
-- so this index exists only here: schema.prisma keeps the plain @unique, and
-- `prisma migrate diff` ignores expression indexes it cannot represent, so the
-- CI drift gate stays green.
--
-- The pre-flight block turns an existing case-insensitive duplicate into an
-- actionable failure instead of a bare "could not create unique index" error.

DO $$
DECLARE
  duplicates text;
BEGIN
  SELECT string_agg(duplicate, ', ') INTO duplicates
  FROM (
    SELECT lower(name) || ' (' || count(*)::text || ' rows)' AS duplicate
    FROM departments
    GROUP BY lower(name)
    HAVING count(*) > 1
  ) AS department_duplicates;

  IF duplicates IS NOT NULL THEN
    RAISE EXCEPTION
      'Cannot add the case-insensitive unique index on departments.name. Merge or rename these duplicates first: %',
      duplicates;
  END IF;

  SELECT string_agg(duplicate, ', ') INTO duplicates
  FROM (
    SELECT lower(name) || ' (' || count(*)::text || ' rows)' AS duplicate
    FROM job_roles
    GROUP BY lower(name)
    HAVING count(*) > 1
  ) AS job_role_duplicates;

  IF duplicates IS NOT NULL THEN
    RAISE EXCEPTION
      'Cannot add the case-insensitive unique index on job_roles.name. Merge or rename these duplicates first: %',
      duplicates;
  END IF;
END
$$;

CREATE UNIQUE INDEX "departments_name_lower_key" ON "departments" (lower("name"));
CREATE UNIQUE INDEX "job_roles_name_lower_key" ON "job_roles" (lower("name"));
