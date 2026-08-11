import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/drizzle/schema";

const DEFAULT_DATABASE_URL =
  "postgresql://[REDACTED]:[REDACTED]@127.0.0.1:5432/[REDACTED]";

const PRODUCTION_POOL_MAX = 10;
const DEVELOPMENT_POOL_MAX = 2;
const POOL_IDLE_TIMEOUT_SECONDS = 20;
const POOL_CONNECT_TIMEOUT_SECONDS = 10;

type PgClient = ReturnType<typeof postgres>;
type PgDb = ReturnType<typeof drizzle<typeof schema>>;

const globalCache = globalThis as typeof globalThis & {
  __appPgClient?: PgClient;
  __appPgDb?: PgDb;
};

let client: PgClient | null = null;
let dbInstance: PgDb | null = null;

export function getDatabaseUrl(): string {
  return process.env.DATABASE_URL?.trim() || DEFAULT_DATABASE_URL;
}

function poolMaxSize(): number {
  return process.env.NODE_ENV === "production"
    ? PRODUCTION_POOL_MAX
    : DEVELOPMENT_POOL_MAX;
}

function readCachedDb(): PgDb | undefined {
  if (process.env.NODE_ENV !== "production") {
    return globalCache.__appPgDb;
  }
  return dbInstance ?? undefined;
}

function storeDb(nextClient: PgClient, nextDb: PgDb): void {
  if (process.env.NODE_ENV !== "production") {
    globalCache.__appPgClient = nextClient;
    globalCache.__appPgDb = nextDb;
    return;
  }
  client = nextClient;
  dbInstance = nextDb;
}

export function getDb() {
  const cached = readCachedDb();
  if (cached) return cached;

  const url = getDatabaseUrl();
  const nextClient = postgres(url, {
    max: poolMaxSize(),
    idle_timeout: POOL_IDLE_TIMEOUT_SECONDS,
    connect_timeout: POOL_CONNECT_TIMEOUT_SECONDS,
  });
  const nextDb = drizzle(nextClient, { schema });
  storeDb(nextClient, nextDb);
  return nextDb;
}

export type Db = ReturnType<typeof getDb>;

/** Closes the pooled connection (tests / scripts). */
export async function closeDb(): Promise<void> {
  const toClose =
    process.env.NODE_ENV !== "production"
      ? globalCache.__appPgClient
      : client;
  if (toClose) {
    await toClose.end({ timeout: 5 });
  }
  globalCache.__appPgClient = undefined;
  globalCache.__appPgDb = undefined;
  client = null;
  dbInstance = null;
}
