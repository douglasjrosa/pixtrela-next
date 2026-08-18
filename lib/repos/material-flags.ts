import { and, asc, count, desc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";

import {
  flags,
  subTaskCategories,
  subTaskDependencies,
  subTaskFlags,
  subTasks,
} from "@/drizzle/schema";
import { formatMaterialFlagCode } from "@/lib/business/material-flag-code";
import { getDb, type Db } from "@/lib/db/client";
import type { MaterialFlagFormInput, MaterialFlagListFilters } from "@/lib/schemas/material-flag";
import { SETTINGS_ENTITY_LIST_PAGE_SIZE } from "@/lib/schemas/sub-task-category";

export type MaterialFlagListItem = {
  id: string;
  index: number;
  categoryId: string;
  categoryName: string;
  categoryRef: string;
  code: string;
  occupied: boolean;
};

function toListItem(row: {
  id: string;
  index: number;
  categoryId: string;
  categoryName: string;
  categoryRef: string;
  occupiedSubTaskId: string | null;
}): MaterialFlagListItem {
  return {
    id: row.id,
    index: row.index,
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    categoryRef: row.categoryRef,
    code: formatMaterialFlagCode(row.categoryRef, row.index),
    occupied: Boolean(row.occupiedSubTaskId),
  };
}

export async function listMaterialFlags(
  filters: MaterialFlagListFilters,
  page: number,
  db: Db = getDb(),
) {
  const conditions = [];
  if (filters.categoryId) {
    conditions.push(eq(flags.subTaskCategoryId, filters.categoryId));
  }
  if (filters.q) {
    conditions.push(
      or(
        ilike(subTaskCategories.name, `%${filters.q}%`),
        ilike(subTaskCategories.ref, `%${filters.q}%`),
        sql`(${subTaskCategories.ref} || '-' || ${flags.index}::text) ilike ${"%" + filters.q + "%"}`,
      ),
    );
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await db
    .select({ total: count() })
    .from(flags)
    .innerJoin(
      subTaskCategories,
      eq(flags.subTaskCategoryId, subTaskCategories.id),
    )
    .where(where);

  const orderExpr =
    filters.column === "index"
      ? flags.index
      : filters.column === "category"
        ? subTaskCategories.name
        : sql`${subTaskCategories.ref} || '-' || lpad(${flags.index}::text, 8, '0')`;
  const direction = filters.direction === "desc" ? desc : asc;

  const items = await db
    .select({
      id: flags.id,
      index: flags.index,
      categoryId: flags.subTaskCategoryId,
      categoryName: subTaskCategories.name,
      categoryRef: subTaskCategories.ref,
      occupiedSubTaskId: subTaskFlags.subTaskId,
    })
    .from(flags)
    .innerJoin(
      subTaskCategories,
      eq(flags.subTaskCategoryId, subTaskCategories.id),
    )
    .leftJoin(subTaskFlags, eq(subTaskFlags.flagId, flags.id))
    .where(where)
    .orderBy(direction(orderExpr))
    .limit(SETTINGS_ENTITY_LIST_PAGE_SIZE)
    .offset((page - 1) * SETTINGS_ENTITY_LIST_PAGE_SIZE);

  return { items: items.map(toListItem), total: Number(total) };
}

export async function findMaterialFlagById(id: string, db: Db = getDb()) {
  const [row] = await db
    .select({
      id: flags.id,
      index: flags.index,
      categoryId: flags.subTaskCategoryId,
      categoryName: subTaskCategories.name,
      categoryRef: subTaskCategories.ref,
      occupiedSubTaskId: subTaskFlags.subTaskId,
    })
    .from(flags)
    .innerJoin(
      subTaskCategories,
      eq(flags.subTaskCategoryId, subTaskCategories.id),
    )
    .leftJoin(subTaskFlags, eq(subTaskFlags.flagId, flags.id))
    .where(eq(flags.id, id))
    .limit(1);
  return row ? toListItem(row) : null;
}

export async function nextFlagIndexForCategory(
  categoryId: string,
  db: Db = getDb(),
) {
  const [row] = await db
    .select({ maxIndex: sql<number>`coalesce(max(${flags.index}), 0)` })
    .from(flags)
    .where(eq(flags.subTaskCategoryId, categoryId));
  return Number(row?.maxIndex ?? 0) + 1;
}

export async function createMaterialFlag(
  input: MaterialFlagFormInput,
  db: Db = getDb(),
) {
  const [created] = await db
    .insert(flags)
    .values({
      subTaskCategoryId: input.subTaskCategoryId,
      index: input.index,
    })
    .returning();
  return created;
}

export async function updateMaterialFlag(
  id: string,
  input: MaterialFlagFormInput,
  db: Db = getDb(),
) {
  const [updated] = await db
    .update(flags)
    .set({
      subTaskCategoryId: input.subTaskCategoryId,
      index: input.index,
      updatedAt: new Date(),
    })
    .where(eq(flags.id, id))
    .returning();
  if (!updated) throw new Error("notFound");
  return updated;
}

export async function deleteMaterialFlag(id: string, db: Db = getDb()) {
  const [occupied] = await db
    .select({ flagId: subTaskFlags.flagId })
    .from(subTaskFlags)
    .where(eq(subTaskFlags.flagId, id))
    .limit(1);
  if (occupied) throw new Error("flagOccupied");
  await db.delete(flags).where(eq(flags.id, id));
}

export async function listAssignedFlagsForSubTasks(
  subTaskIds: string[],
  db: Db = getDb(),
) {
  if (subTaskIds.length === 0) return [];
  return db
    .select({
      subTaskId: subTaskFlags.subTaskId,
      flagId: flags.id,
      index: flags.index,
      categoryRef: subTaskCategories.ref,
    })
    .from(subTaskFlags)
    .innerJoin(flags, eq(subTaskFlags.flagId, flags.id))
    .innerJoin(
      subTaskCategories,
      eq(flags.subTaskCategoryId, subTaskCategories.id),
    )
    .where(inArray(subTaskFlags.subTaskId, subTaskIds));
}

export async function listAvailableFlagsForCategory(
  categoryId: string,
  keepForSubTaskId?: string,
  db: Db = getDb(),
) {
  return db
    .select({
      id: flags.id,
      index: flags.index,
      categoryRef: subTaskCategories.ref,
    })
    .from(flags)
    .innerJoin(
      subTaskCategories,
      eq(flags.subTaskCategoryId, subTaskCategories.id),
    )
    .leftJoin(subTaskFlags, eq(subTaskFlags.flagId, flags.id))
    .where(
      and(
        eq(flags.subTaskCategoryId, categoryId),
        or(
          isNull(subTaskFlags.flagId),
          keepForSubTaskId
            ? eq(subTaskFlags.subTaskId, keepForSubTaskId)
            : sql`false`,
        ),
      ),
    )
    .orderBy(asc(flags.index));
}

export async function assignFlagsToSubTask(
  subTaskId: string,
  flagIds: string[],
  db: Db = getDb(),
): Promise<void> {
  const uniqueIds = [...new Set(flagIds.filter((id) => id.trim().length > 0))];
  if (uniqueIds.length === 0) return;

  const [sub] = await db
    .select({
      id: subTasks.id,
      categoryId: subTasks.subTaskCategoryId,
    })
    .from(subTasks)
    .where(eq(subTasks.id, subTaskId))
    .limit(1);
  if (!sub) throw new Error("notFound");
  if (!sub.categoryId) throw new Error("subTaskHasNoCategory");

  const rows = await db
    .select({
      id: flags.id,
      categoryId: flags.subTaskCategoryId,
    })
    .from(flags)
    .where(inArray(flags.id, uniqueIds));
  if (rows.length !== uniqueIds.length) throw new Error("flagNotFound");
  if (rows.some((row) => row.categoryId !== sub.categoryId)) {
    throw new Error("flagWrongCategory");
  }

  const occupied = await db
    .select({
      flagId: subTaskFlags.flagId,
      subTaskId: subTaskFlags.subTaskId,
    })
    .from(subTaskFlags)
    .where(inArray(subTaskFlags.flagId, uniqueIds));
  if (occupied.some((row) => row.subTaskId !== subTaskId)) {
    throw new Error("flagOccupied");
  }

  const already = new Set(
    occupied.filter((row) => row.subTaskId === subTaskId).map((row) => row.flagId),
  );
  const toInsert = uniqueIds.filter((id) => !already.has(id));
  if (toInsert.length === 0) return;

  await db.insert(subTaskFlags).values(
    toInsert.map((flagId) => ({ subTaskId, flagId })),
  );
}

export async function listFlagIdsForSubTask(
  subTaskId: string,
  db: Db = getDb(),
): Promise<string[]> {
  const rows = await db
    .select({ flagId: subTaskFlags.flagId })
    .from(subTaskFlags)
    .where(eq(subTaskFlags.subTaskId, subTaskId));
  return rows.map((row) => row.flagId);
}

export async function releaseFlagsForSubTask(
  subTaskId: string,
  db: Db = getDb(),
): Promise<void> {
  await db.delete(subTaskFlags).where(eq(subTaskFlags.subTaskId, subTaskId));
}

export async function subTaskHasDependents(
  subTaskId: string,
  db: Db = getDb(),
): Promise<boolean> {
  const [row] = await db
    .select({ id: subTaskDependencies.subTaskId })
    .from(subTaskDependencies)
    .where(eq(subTaskDependencies.dependsOnSubTaskId, subTaskId))
    .limit(1);
  return Boolean(row);
}

export async function releaseProducerFlagsWhenConsumersFinished(
  taskId: string,
  db: Db = getDb(),
): Promise<void> {
  const siblings = await db
    .select({
      id: subTasks.id,
      status: subTasks.status,
    })
    .from(subTasks)
    .where(eq(subTasks.taskId, taskId));
  const statusById = new Map(siblings.map((row) => [row.id, row.status]));
  const producerIds = siblings.map((row) => row.id);
  if (producerIds.length === 0) return;

  const depRows = await db
    .select({
      consumerId: subTaskDependencies.subTaskId,
      producerId: subTaskDependencies.dependsOnSubTaskId,
    })
    .from(subTaskDependencies)
    .where(inArray(subTaskDependencies.dependsOnSubTaskId, producerIds));

  const consumersByProducer = new Map<string, string[]>();
  for (const row of depRows) {
    const list = consumersByProducer.get(row.producerId) ?? [];
    list.push(row.consumerId);
    consumersByProducer.set(row.producerId, list);
  }

  const toRelease: string[] = [];
  for (const producerId of producerIds) {
    const consumers = consumersByProducer.get(producerId) ?? [];
    if (consumers.length === 0) continue;
    const allFinished = consumers.every(
      (id) => statusById.get(id) === "finished",
    );
    if (allFinished) toRelease.push(producerId);
  }
  if (toRelease.length === 0) return;
  await db.delete(subTaskFlags).where(inArray(subTaskFlags.subTaskId, toRelease));
}

export async function loadHasAssignedFlagsBySubTaskId(
  subTaskIds: string[],
  db: Db = getDb(),
): Promise<Set<string>> {
  if (subTaskIds.length === 0) return new Set();
  const rows = await db
    .select({ subTaskId: subTaskFlags.subTaskId })
    .from(subTaskFlags)
    .where(inArray(subTaskFlags.subTaskId, subTaskIds));
  return new Set(rows.map((row) => row.subTaskId));
}
