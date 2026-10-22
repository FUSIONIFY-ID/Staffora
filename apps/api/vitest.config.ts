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
