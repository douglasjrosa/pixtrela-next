import { asc, eq, ilike } from "drizzle-orm";

import { subTaskPresets } from "@/drizzle/schema";
import type { SubTaskPreset } from "@/lib/business/subtask-preset";
import { getDb, type Db } from "@/lib/db/client";
import type { SubTaskPresetFormInput } from "@/lib/schemas/sub-task-preset";

export const SUBTASK_PRESET_SEARCH_LIMIT = 10;
export const SUBTASK_PRESET_LIST_LIMIT = 100;

function mapPresetRow(
  row: typeof subTaskPresets.$inferSelect,
): SubTaskPreset {
  return {
    documentId: row.id,
    name: row.name,
    sharingType: row.sharingType,
    maxSameTimeWorkers: row.maxSameTimeWorkers,
    expectedTime: row.expectedTime,
  };
}

export async function searchSubTaskPresetsByName(
  query: string,
  db: Db = getDb(),
): Promise<SubTaskPreset[]> {
  const rows = await db
    .select()
    .from(subTaskPresets)
    .where(ilike(subTaskPresets.name, `%${query.trim()}%`))
    .orderBy(asc(subTaskPresets.name))
    .limit(SUBTASK_PRESET_SEARCH_LIMIT);
  return rows.map(mapPresetRow);
}

export async function listSubTaskPresetsRepo(
  db: Db = getDb(),
): Promise<SubTaskPreset[]> {
  const rows = await db
    .select()
    .from(subTaskPresets)
    .orderBy(asc(subTaskPresets.name))
    .limit(SUBTASK_PRESET_LIST_LIMIT);
  return rows.map(mapPresetRow);
}

export async function createSubTaskPresetRepo(
  input: SubTaskPresetFormInput,
  db: Db = getDb(),
): Promise<string> {
  const [row] = await db
    .insert(subTaskPresets)
    .values({
      name: input.name.trim(),
      sharingType: input.sharingType,
      maxSameTimeWorkers: input.maxSameTimeWorkers,
      expectedTime: input.expectedTime,
    })
    .returning({ id: subTaskPresets.id });
  return row.id;
}

export async function updateSubTaskPresetRepo(
  id: string,
  input: SubTaskPresetFormInput,
  db: Db = getDb(),
): Promise<void> {
  await db
    .update(subTaskPresets)
    .set({
      name: input.name.trim(),
      sharingType: input.sharingType,
      maxSameTimeWorkers: input.maxSameTimeWorkers,
      expectedTime: input.expectedTime,
      updatedAt: new Date(),
    })
    .where(eq(subTaskPresets.id, id));
}

export async function deleteSubTaskPresetById(
  id: string,
  db: Db = getDb(),
): Promise<void> {
  await db.delete(subTaskPresets).where(eq(subTaskPresets.id, id));
}
