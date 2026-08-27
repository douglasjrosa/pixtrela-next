import { eq } from "drizzle-orm";

import { ribermaxConnectionSettings } from "@/drizzle/schema";
import { getDb, type Db } from "@/lib/db/client";

export type RibermaxConnection = {
  baseUrl: string;
  token: string;
};

export async function getRibermaxConnection(
  db: Db = getDb(),
): Promise<RibermaxConnection | null> {
  const [row] = await db.select().from(ribermaxConnectionSettings).limit(1);
  if (!row?.baseUrl?.trim() || !row.token?.trim()) return null;
  return { baseUrl: row.baseUrl.trim(), token: row.token };
}

export async function upsertRibermaxConnection(
  input: RibermaxConnection,
  db: Db = getDb(),
): Promise<RibermaxConnection> {
  const baseUrl = input.baseUrl.trim();
  const token = input.token.trim();
  const existing = await db.select().from(ribermaxConnectionSettings).limit(1);
  if (existing[0]) {
    const [updated] = await db
      .update(ribermaxConnectionSettings)
      .set({ baseUrl, token, updatedAt: new Date() })
      .where(eq(ribermaxConnectionSettings.id, existing[0].id))
      .returning();
    return { baseUrl: updated.baseUrl, token: updated.token };
  }
  const [created] = await db
    .insert(ribermaxConnectionSettings)
    .values({ baseUrl, token })
    .returning();
  return { baseUrl: created.baseUrl, token: created.token };
}
