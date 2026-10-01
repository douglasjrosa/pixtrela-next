import { sql } from "drizzle-orm";

import { getDb, type Db } from "@/lib/db/client";

/**
 * Serializes work for one template code on this Postgres session/transaction.
 * Uses a transaction-scoped advisory lock so concurrent CRM posts wait.
 */
export async function withTemplateCodeLock<T>(
  code: string,
  fn: (db: Db) => Promise<T>,
): Promise<T> {
  const db = getDb();
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${code}))`);
    return fn(tx as unknown as Db);
  });
}
