import {
  DEFAULT_PORT,
  MAX_TCP_PORT,
  MIN_SECRET_LENGTH,
  MIN_TCP_PORT,
  REDIS_DEFAULT_URL,
} from "./constants.js";

export type RealtimeConfig = {
  port: number;
  redisUrl: string;
  publishSecret: string;
  jwtSecret: string;
};

export function loadConfig(env: NodeJS.ProcessEnv): RealtimeConfig {
  const publishSecret = requireSecret(
    env.REALTIME_PUBLISH_SECRET,
    "REALTIME_PUBLISH_SECRET",
  );
  const jwtSecret = requireSecret(env.REALTIME_JWT_SECRET, "REALTIME_JWT_SECRET");
  return {
    port: parsePort(env.PORT),
    redisUrl: env.REDIS_URL?.trim() || REDIS_DEFAULT_URL,
    publishSecret,
    jwtSecret,
  };
}

function requireSecret(value: string | undefined, name: string): string {
  const secret = value?.trim() ?? "";
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `${name} is required and must be at least ${MIN_SECRET_LENGTH} characters.`,
    );
  }
  return secret;
}

function parsePort(value: string | undefined): number {
  if (!value?.trim()) return DEFAULT_PORT;
  const port = Number(value);
  if (!Number.isInteger(port) || port < MIN_TCP_PORT || port > MAX_TCP_PORT) {
    throw new Error("PORT must be an integer from 1 to 65535.");
  }
  return port;
}
