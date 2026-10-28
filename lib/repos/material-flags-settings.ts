import { eq } from "drizzle-orm";

import { materialFlagsSettings } from "@/drizzle/schema";
import { getDb, type Db } from "@/lib/db/client";

export type MaterialFlagsSettingsRecord = {
  id: string;
  enabled: boolean;
};

export async function getMaterialFlagsSettings(
  db: Db = getDb(),
): Promise<MaterialFlagsSettingsRecord> {
  const [row] = await db.select().from(materialFlagsSettings).limit(1);
  if (row) {
    return { id: row.id, enabled: row.enabled };
  }
  const [created] = await db
    .insert(materialFlagsSettings)
    .values({ enabled: true })
    .returning({
      id: materialFlagsSettings.id,
      enabled: materialFlagsSettings.enabled,
    });
  return created ?? { id: "", enabled: true };
}

export async function setMaterialFlagsEnabled(
  enabled: boolean,
  db: Db = getDb(),
): Promise<MaterialFlagsSettingsRecord> {
  const existing = await getMaterialFlagsSettings(db);
  if (!existing.id) {
    const [created] = await db
      .insert(materialFlagsSettings)
      .values({ enabled })
      .returning({
        id: materialFlagsSettings.id,
        enabled: materialFlagsSettings.enabled,
      });
    return created ?? { id: "", enabled };
  }
  const [updated] = await db
    .update(materialFlagsSettings)
    .set({ enabled, updatedAt: new Date() })
    .where(eq(materialFlagsSettings.id, existing.id))
    .returning({
      id: materialFlagsSettings.id,
      enabled: materialFlagsSettings.enabled,
    });
  return updated ?? { id: existing.id, enabled };
}
