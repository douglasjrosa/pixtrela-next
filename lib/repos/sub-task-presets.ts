import { asc, count, desc, eq, ilike } from "drizzle-orm";

import { factoryActions, subTaskPresets } from "@/drizzle/schema";
import { parseActionUnitTime } from "@/lib/business/factory-action";
import type { SubTaskPreset } from "@/lib/business/subtask-preset";
import { getDb, type Db } from "@/lib/db/client";
import type { SubTaskPresetFormInput } from "@/lib/schemas/sub-task-preset";
import type { SubtaskPresetListSort } from "@/lib/schemas/subtask-preset-list-sort";

export const SUBTASK_PRESET_SEARCH_LIMIT = 10;
export const SUBTASK_PRESET_LIST_LIMIT = 100;

type PresetJoinRow = {
  id: string;
  name: string;
  sharingType: "qty" | "duration";
  maxSameTimeWorkers: number;
  subTaskCategoryId: string | null;
  actionId: string;
  actionName: string;
  actionUnitTime: string;
  actionQtyQuestion: string;
};

function mapPresetRow(row: PresetJoinRow): SubTaskPreset {
  return {
    documentId: row.id,
    name: row.name,
    sharingType: row.sharingType,
    maxSameTimeWorkers: row.maxSameTimeWorkers,
    actionId: row.actionId,
    actionName: row.actionName,
    actionUnitTime: parseActionUnitTime(row.actionUnitTime),
    actionQtyQuestion: row.actionQtyQuestion,
    subTaskCategoryId: row.subTaskCategoryId,
  };
}

const PRESET_SELECT = {
  id: subTaskPresets.id,
  name: subTaskPresets.name,
  sharingType: subTaskPresets.sharingType,
  maxSameTimeWorkers: subTaskPresets.maxSameTimeWorkers,
  subTaskCategoryId: subTaskPresets.subTaskCategoryId,
  actionId: factoryActions.id,
  actionName: factoryActions.name,
  actionUnitTime: factoryActions.unitTime,
  actionQtyQuestion: factoryActions.qtyQuestion,
};

function subtaskPresetListOrderBy(sort: SubtaskPresetListSort) {
  const dir = sort.direction === "desc" ? desc : asc;
  if (sort.column === "sharingType") {
    return [
      dir(subTaskPresets.sharingType),
      asc(subTaskPresets.name),
      asc(subTaskPresets.id),
    ];
  }
  if (sort.column === "actionName") {
    return [
      dir(factoryActions.name),
      asc(subTaskPresets.name),
      asc(subTaskPresets.id),
    ];
  }
  return [dir(subTaskPresets.name), asc(subTaskPresets.id)];
}

export async function searchSubTaskPresetsByName(
  query: string,
  db: Db = getDb(),
): Promise<SubTaskPreset[]> {
  const rows = await db
    .select(PRESET_SELECT)
    .from(subTaskPresets)
    .innerJoin(factoryActions, eq(subTaskPresets.actionId, factoryActions.id))
    .where(ilike(subTaskPresets.name, `%${query.trim()}%`))
    .orderBy(asc(subTaskPresets.name))
    .limit(SUBTASK_PRESET_SEARCH_LIMIT);
  return rows.map(mapPresetRow);
}

export async function findSubTaskPresetByName(
  name: string,
  db: Db = getDb(),
): Promise<SubTaskPreset | null> {
  const [row] = await db
    .select(PRESET_SELECT)
    .from(subTaskPresets)
    .innerJoin(factoryActions, eq(subTaskPresets.actionId, factoryActions.id))
    .where(eq(subTaskPresets.name, name.trim()))
    .limit(1);
  return row ? mapPresetRow(row) : null;
}

export async function listSubTaskPresetsRepo(
  db: Db = getDb(),
): Promise<SubTaskPreset[]> {
  const rows = await db
    .select(PRESET_SELECT)
    .from(subTaskPresets)
    .innerJoin(factoryActions, eq(subTaskPresets.actionId, factoryActions.id))
    .orderBy(asc(subTaskPresets.name))
    .limit(SUBTASK_PRESET_LIST_LIMIT);
  return rows.map(mapPresetRow);
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
    .select(PRESET_SELECT)
    .from(subTaskPresets)
    .innerJoin(factoryActions, eq(subTaskPresets.actionId, factoryActions.id))
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
      actionId: input.actionId,
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
      actionId: input.actionId,
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
