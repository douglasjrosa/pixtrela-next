import { eq } from "drizzle-orm";

import { entryAccessSettings } from "@/drizzle/schema";
import {
  defaultEntryAccessForSurface,
  type EntryAccessByDevice,
  type EntryAccessSurface,
} from "@/lib/business/entry-access";
import { getDb, type Db } from "@/lib/db/client";

function mapRow(row: {
  computerUsername: boolean;
  computerCode: boolean;
  computerFace: boolean;
  computerNfc: boolean;
  mobileUsername: boolean;
  mobileCode: boolean;
  mobileFace: boolean;
  mobileNfc: boolean;
}): EntryAccessByDevice {
  return {
    computer: {
      username: row.computerUsername,
      code: row.computerCode,
      face: row.computerFace,
      nfc: row.computerNfc,
    },
    mobile: {
      username: row.mobileUsername,
      code: row.mobileCode,
      face: row.mobileFace,
      nfc: row.mobileNfc,
    },
  };
}

function toColumns(settings: EntryAccessByDevice) {
  return {
    computerUsername: settings.computer.username,
    computerCode: settings.computer.code,
    computerFace: settings.computer.face,
    computerNfc: settings.computer.nfc,
    mobileUsername: settings.mobile.username,
    mobileCode: settings.mobile.code,
    mobileFace: settings.mobile.face,
    mobileNfc: settings.mobile.nfc,
  };
}

export async function getEntryAccessSettings(
  surface: EntryAccessSurface,
  db: Db = getDb(),
): Promise<EntryAccessByDevice> {
  const defaults = defaultEntryAccessForSurface(surface);
  const [row] = await db
    .select()
    .from(entryAccessSettings)
    .where(eq(entryAccessSettings.surface, surface))
    .limit(1);
  if (row) return mapRow(row);

  const [created] = await db
    .insert(entryAccessSettings)
    .values({
      surface,
      ...toColumns(defaults),
    })
    .onConflictDoNothing({ target: entryAccessSettings.surface })
    .returning();
  if (created) return mapRow(created);

  const [existing] = await db
    .select()
    .from(entryAccessSettings)
    .where(eq(entryAccessSettings.surface, surface))
    .limit(1);
  return existing ? mapRow(existing) : defaults;
}

export async function upsertEntryAccessSettings(
  surface: EntryAccessSurface,
  settings: EntryAccessByDevice,
  db: Db = getDb(),
): Promise<EntryAccessByDevice> {
  const existing = await db
    .select({ id: entryAccessSettings.id })
    .from(entryAccessSettings)
    .where(eq(entryAccessSettings.surface, surface))
    .limit(1);

  if (existing[0]) {
    const [updated] = await db
      .update(entryAccessSettings)
      .set({
        ...toColumns(settings),
        updatedAt: new Date(),
      })
      .where(eq(entryAccessSettings.surface, surface))
      .returning();
    return mapRow(updated);
  }

  const [created] = await db
    .insert(entryAccessSettings)
    .values({
      surface,
      ...toColumns(settings),
    })
    .returning();
  return mapRow(created);
}
