import "dotenv/config";
import { createApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { logger } from "./common/logging/logger.js";
import { closeSessionStore } from "./common/auth/session.js";

const env = loadEnv();
const server = createApp().listen(env.PORT, () =>
  logger.info({ port: env.PORT }, "Staffora API listening"),
);

// Docker sends SIGTERM on stop and deploy. Stop accepting requests first, then close the
// session-store pools so their PostgreSQL connections are released instead of dropped.
function shutdown(signal: NodeJS.Signals): void {
  logger.info({ signal }, "Staffora API shutting down");
  server.close(() => {
    closeSessionStore()
      .catch((error: unknown) =>
        logger.error({ err: error }, "Failed to close the session store"),
      )
      .finally(() => process.exit(0));
  });
}

process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
