import { eq } from "drizzle-orm";

import { crmConnectionSettings } from "@/drizzle/schema";
import { getDb, type Db } from "@/lib/db/client";

import type { CrmConnection, CrmConnectionInput } from "./schema";

function mapConnection(row: {
  baseUrl: string | null;
  webhookSecret: string;
}): CrmConnection | null {
  const baseUrl = row.baseUrl?.trim().replace(/\/+$/, "") ?? "";
  const webhookSecret = row.webhookSecret?.trim() ?? "";
  if (!baseUrl || !webhookSecret) return null;
  return { baseUrl, webhookSecret };
}

export async function getCrmConnection(
  db: Db = getDb(),
): Promise<CrmConnection | null> {
  const [row] = await db.select().from(crmConnectionSettings).limit(1);
  if (!row) return null;
  return mapConnection(row);
}

/** Secret used to verify inbound CRM webhooks (baseUrl optional). */
export async function getCrmWebhookSecret(
  db: Db = getDb(),
): Promise<string | null> {
  const [row] = await db.select().from(crmConnectionSettings).limit(1);
  const secret = row?.webhookSecret?.trim() ?? "";
  return secret || null;
}

export async function upsertCrmConnection(
  input: CrmConnectionInput,
  db: Db = getDb(),
): Promise<CrmConnection> {
  const baseUrl = input.baseUrl.trim().replace(/\/+$/, "");
  const webhookSecret = input.webhookSecret.trim();
  const existing = await db.select().from(crmConnectionSettings).limit(1);
  if (existing[0]) {
    const [updated] = await db
      .update(crmConnectionSettings)
      .set({ baseUrl, webhookSecret, updatedAt: new Date() })
      .where(eq(crmConnectionSettings.id, existing[0].id))
      .returning();
    return mapConnection(updated)!;
  }
  const [created] = await db
    .insert(crmConnectionSettings)
    .values({ baseUrl, webhookSecret })
    .returning();
  return mapConnection(created)!;
}
