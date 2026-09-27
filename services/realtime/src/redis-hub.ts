import { createClient } from "redis";
import { logError } from "./logger.js";

export type RealtimeHub = {
  publish: (channel: string, message: string) => Promise<void>;
  openSubscription: (
    channel: string,
    onMessage: (message: string) => void,
  ) => Promise<{ close: () => Promise<void> }>;
  close: () => Promise<void>;
};

const CREDENTIALS_IN_URL = /rediss?:\/\/[^\s@]+@/gi;

export function sanitizeRedisMessage(message: string): string {
  return message.replace(CREDENTIALS_IN_URL, "redis://***@");
}

export async function createRedisHub(redisUrl: string): Promise<RealtimeHub> {
  const publisher = createClient({ url: redisUrl });
  publisher.on("error", (error: Error) => {
    logError("redis_publisher_error", {
      message: sanitizeRedisMessage(error.message),
    });
  });
  await publisher.connect();

  return {
    publish: async (channel, message) => {
      try {
        await publisher.publish(channel, message);
      } catch (error) {
        logRedisFailure("redis_publish_error", error);
        throw new Error("Redis publish failed.");
      }
    },
    openSubscription: (channel, onMessage) =>
      openSubscription(publisher, channel, onMessage),
    close: async () => {
      if (publisher.isOpen) await publisher.quit();
    },
  };
}

type Publisher = ReturnType<typeof createClient>;

async function openSubscription(
  publisher: Publisher,
  channel: string,
  onMessage: (message: string) => void,
): Promise<{ close: () => Promise<void> }> {
  const subscriber = publisher.duplicate();
  subscriber.on("error", (error: Error) => {
    logError("redis_subscriber_error", {
      message: sanitizeRedisMessage(error.message),
    });
  });
  let closed = false;
  try {
    await subscriber.connect();
    await subscriber.subscribe(channel, onMessage);
  } catch (error) {
    logRedisFailure("redis_subscribe_error", error);
    if (subscriber.isOpen) await subscriber.quit();
    throw new Error("Redis subscribe failed.");
  }

  return {
    close: async () => {
      if (closed) return;
      closed = true;
      try {
        if (subscriber.isOpen) await subscriber.unsubscribe(channel);
      } finally {
        if (subscriber.isOpen) await subscriber.quit();
      }
    },
  };
}

function logRedisFailure(event: string, error: unknown): void {
  const raw = error instanceof Error ? error.message : "Redis command failed.";
  logError(event, { message: sanitizeRedisMessage(raw) });
}
