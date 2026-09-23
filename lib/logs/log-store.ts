import { and, desc, eq, gte, or, sql } from "drizzle-orm";

import { logs } from "@/drizzle/schema";
import { getDb, type Db } from "@/lib/db/client";
import type { LogStore } from "@/lib/logs/persist-log";

export function drizzleLogStore(db: Db = getDb()): LogStore {
  return {
    async findRecent(input) {
      const prefix = `${input.dedupeKey}|%`;
      const [row] = await db
        .select({
          id: logs.id,
          count: logs.count,
          description: logs.description,
        })
        .from(logs)
        .where(
          and(
            eq(logs.route, input.route),
            gte(logs.createdAt, input.since),
            or(
              eq(logs.detail, input.dedupeKey),
              sql`${logs.detail} like ${prefix}`,
            ),
          ),
        )
        .orderBy(desc(logs.createdAt))
        .limit(1);
      return row ?? null;
    },
    async insert(row) {
      await db.insert(logs).values({
        userId: row.userId,
        route: row.route,
        description: row.description,
        detail: row.detail,
        count: row.count,
      });
    },
    async increment(id, count, description) {
      await db
        .update(logs)
        .set({ count, description })
        .where(eq(logs.id, id));
    },
  };
}
