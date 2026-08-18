import { asc, count, desc, eq, ilike } from "drizzle-orm";

import { subTaskPresets } from "@/drizzle/schema";
import type { SubTaskPreset } from "@/lib/business/subtask-preset";
import { getDb, type Db } from "@/lib/db/client";
import type { SubTaskPresetFormInput } from "@/lib/schemas/sub-task-preset";
import type { SubtaskPresetListSort } from "@/lib/schemas/subtask-preset-list-sort";

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
    subTaskCategoryId: row.subTaskCategoryId,
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

function subtaskPresetListOrderBy(sort: SubtaskPresetListSort) {
  const dir = sort.direction === "desc" ? desc : asc;
  if (sort.column === "sharingType") {
    return [
      dir(subTaskPresets.sharingType),
      asc(subTaskPresets.name),
      asc(subTaskPresets.id),
    ];
  }
  if (sort.column === "expectedTime") {
    return [
      dir(subTaskPresets.expectedTime),
      asc(subTaskPresets.name),
      asc(subTaskPresets.id),
    ];
  }
  return [dir(subTaskPresets.name), asc(subTaskPresets.id)];
}

export async function listSubTaskPresetsPaged(
  options: {
    page?: number;
    pageSize?: number;
    sort?: SubtaskPresetListSort;
  } = {},
  db: Db = getDb(),
): Promise<{ items: SubTaskPreset[]; total: number }> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.max(1, options.pageSize ?? 10);
  const offset = (page - 1) * pageSize;
  const sort = options.sort ?? { column: "name", direction: "asc" };

  const [totalRow] = await db
    .select({ total: count() })
    .from(subTaskPresets);

  const rows = await db
    .select()
    .from(subTaskPresets)
    .orderBy(...subtaskPresetListOrderBy(sort))
    .limit(pageSize)
    .offset(offset);

  return {
    items: rows.map(mapPresetRow),
    total: totalRow?.total ?? 0,
  };
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
      subTaskCategoryId: input.subTaskCategoryId || null,
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
      subTaskCategoryId: input.subTaskCategoryId || null,
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
