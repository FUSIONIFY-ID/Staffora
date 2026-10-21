-- Normalised, case-insensitive uniqueness for skill names (ERD 2.3:
-- "name: Unique constraint (case-insensitive/normalized)").
--
-- PostgreSQL has no case-insensitive UNIQUE constraint, so the rule is enforced
-- with a unique index over lower(name). Prisma cannot model an expression index,
-- so this index exists only here: schema.prisma keeps the plain @unique, and
-- `prisma migrate diff` ignores expression indexes it cannot represent, so the
-- CI drift gate stays green.
--
-- The plain `skills_name_key` unique index is case-sensitive, so it lets both
-- "React" and "react" exist as separate skills. The index below closes that gap
-- and makes the pair a genuine duplicate for skill creation (US02 AC01.03).
--
-- The pre-flight block turns an existing case-insensitive duplicate into an
-- actionable failure instead of a bare "could not create unique index" error.

DO $$
DECLARE
  duplicates text;
BEGIN
  SELECT string_agg(duplicate, ', ') INTO duplicates
  FROM (
    SELECT lower(name) || ' -> ' || string_agg(id::text || ' (' || name || ')', ', ' ORDER BY created_at, id)
      || ' [' || count(*)::text || ' rows]' AS duplicate
    FROM skills
    GROUP BY lower(name)
    HAVING count(*) > 1
  ) AS skill_duplicates;

  IF duplicates IS NOT NULL THEN
    RAISE EXCEPTION
      'Cannot add the case-insensitive unique index on skills.name. Merge or rename these duplicates first: %',
      duplicates;
  END IF;
END
$$;

CREATE UNIQUE INDEX "skills_name_lower_key" ON "skills" (lower("name"));
