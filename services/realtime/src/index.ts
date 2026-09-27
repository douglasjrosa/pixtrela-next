import { loadConfig } from "./config.js";
import { logError, logInfo } from "./logger.js";
import { createRedisHub, sanitizeRedisMessage } from "./redis-hub.js";
import { createRealtimeServer } from "./server.js";

async function main(): Promise<void> {
  const config = loadConfig(process.env);
  const hub = await createRedisHub(config.redisUrl);
  const server = createRealtimeServer({
    publishSecret: config.publishSecret,
    jwtSecret: config.jwtSecret,
    publish: (channel, message) => hub.publish(channel, message),
    openSubscription: (channel, onMessage) => hub.openSubscription(channel, onMessage),
  });

  await new Promise<void>((resolve) => {
    server.listen(config.port, "0.0.0.0", () => resolve());
  });
  logInfo("listening", { port: config.port });

  const shutdown = async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    await hub.close();
  };

  process.once("SIGTERM", () => {
    void shutdown().then(() => process.exit(0));
  });
  process.once("SIGINT", () => {
    void shutdown().then(() => process.exit(0));
  });
}

void main().catch((error: unknown) => {
  const raw = error instanceof Error ? error.message : "Realtime hub failed to start.";
  logError("startup_failed", { message: sanitizeRedisMessage(raw) });
  process.exit(1);
});
