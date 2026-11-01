import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "vitest/config";

/**
 * Test runs must not share a database with `npm run dev` and `db:seed`.
 *
 * The suite creates and removes its own rows, but it still writes to whichever
 * database DATABASE_URL points at, and the seed script and the development
 * server use the same variable. When `apps/api/.env.test` exists it is loaded
 * first and takes precedence, so a developer can point the suite at a dedicated
 * database without changing their shell. CI has no such file and keeps using
 * the ephemeral service container it provisions.
 *
 * Copy `.env.test.example` to `.env.test` and run the migrate and seed scripts
 * against that database before the first run; docs/development/testing-guide.md
 * has the commands.
 */
const envTestPath = fileURLToPath(new URL(".env.test", import.meta.url));
if (existsSync(envTestPath)) {
  loadEnv({ path: envTestPath, override: true, quiet: true });
}

/**
 * Refuses to run the suite against a database that is not a dedicated test database.
 * The database name must end in `_test`. GitHub Actions sets CI=true and provisions its
 * own ephemeral database, so the check is skipped there.
 */
function assertTestDatabase(databaseUrl: string): void {
  if (databaseUrl === "") {
    throw new Error(
      "Tes berhenti: DATABASE_URL belum diset. Buat apps/api/.env.test dari .env.test.example (lihat docs/development/testing-guide.md).",
    );
  }
  const databaseName = new URL(databaseUrl).pathname.slice(1);
  if (!databaseName.endsWith("_test")) {
    throw new Error(
      `Tes berhenti: database "${databaseName}" bukan database uji. Nama database uji harus berakhiran _test. Buat apps/api/.env.test dari .env.test.example (lihat docs/development/testing-guide.md).`,
    );
  }
}

if (!process.env.CI) {
  assertTestDatabase(process.env.DATABASE_URL ?? "");
}

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    /**
     * The fixture hashes four passwords with bcrypt cost 12, and CLAUDE.md fixes
     * that cost, so a hook cannot be made fast by lowering it. On a loaded
     * machine one hash took about a second during review and the default 10s
     * beforeAll timeout expired, which failed the suite for an environment
     * reason rather than an assertion. These budgets cover the cold start.
     */
    hookTimeout: 60_000,
    testTimeout: 30_000,
  },
});
