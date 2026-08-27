import { eq } from "drizzle-orm";

import { crmConnectionSettings } from "@/drizzle/schema";
import { getDb, type Db } from "@/lib/db/client";

export async function getCrmWebhookSecret(
  db: Db = getDb(),
): Promise<string | null> {
  const [row] = await db.select().from(crmConnectionSettings).limit(1);
  const secret = row?.webhookSecret?.trim() ?? "";
  return secret || null;
}

export async function upsertCrmWebhookSecret(
  webhookSecret: string,
  db: Db = getDb(),
): Promise<string> {
  const secret = webhookSecret.trim();
  const existing = await db.select().from(crmConnectionSettings).limit(1);
  if (existing[0]) {
    const [updated] = await db
      .update(crmConnectionSettings)
      .set({ webhookSecret: secret, updatedAt: new Date() })
      .where(eq(crmConnectionSettings.id, existing[0].id))
      .returning();
    return updated.webhookSecret;
  }
  const [created] = await db
    .insert(crmConnectionSettings)
    .values({ webhookSecret: secret })
    .returning();
  return created.webhookSecret;
}
