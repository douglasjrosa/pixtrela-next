import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/drizzle/schema";

const DEFAULT_DATABASE_URL =
  "postgresql://pixtrela:pixtrela@127.0.0.1:5432/pixtrela";

let client: ReturnType<typeof postgres> | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDatabaseUrl(): string {
  return process.env.DATABASE_URL?.trim() || DEFAULT_DATABASE_URL;
}

export function getDb() {
  if (dbInstance) return dbInstance;
  const url = getDatabaseUrl();
  client = postgres(url, { max: 10 });
  dbInstance = drizzle(client, { schema });
  return dbInstance;
}

export type Db = ReturnType<typeof getDb>;

/** Closes the pooled connection (tests / scripts). */
export async function closeDb(): Promise<void> {
  if (client) {
    await client.end({ timeout: 5 });
    client = null;
    dbInstance = null;
  }
}
