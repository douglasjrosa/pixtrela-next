import { asc, count, desc, eq, ilike, or } from "drizzle-orm";

import { flags, subTaskCategories, subTasks, subTaskPresets, templateSubTasks } from "@/drizzle/schema";
import { getDb, type Db } from "@/lib/db/client";
import {
  SETTINGS_ENTITY_LIST_PAGE_SIZE,
  type SubTaskCategoryFormInput,
  type SubTaskCategoryListFilters,
} from "@/lib/schemas/sub-task-category";

export async function listSubTaskCategories(
  filters: SubTaskCategoryListFilters,
  page: number,
  db: Db = getDb(),
) {
  const order =
    filters.column === "ref" ? subTaskCategories.ref : subTaskCategories.name;
  const direction = filters.direction === "desc" ? desc : asc;
  const where = filters.q
    ? or(
        ilike(subTaskCategories.name, `%${filters.q}%`),
        ilike(subTaskCategories.ref, `%${filters.q}%`),
      )
    : undefined;

  const [{ total }] = await db
    .select({ total: count() })
    .from(subTaskCategories)
    .where(where);

  const items = await db
    .select()
    .from(subTaskCategories)
    .where(where)
    .orderBy(direction(order))
    .limit(SETTINGS_ENTITY_LIST_PAGE_SIZE)
    .offset((page - 1) * SETTINGS_ENTITY_LIST_PAGE_SIZE);

  return { items, total: Number(total) };
}

export async function listAllSubTaskCategories(db: Db = getDb()) {
  return db
    .select({
      id: subTaskCategories.id,
      name: subTaskCategories.name,
      ref: subTaskCategories.ref,
    })
    .from(subTaskCategories)
    .orderBy(asc(subTaskCategories.name));
}

export async function findSubTaskCategoryById(id: string, db: Db = getDb()) {
  const [row] = await db
    .select()
    .from(subTaskCategories)
    .where(eq(subTaskCategories.id, id))
    .limit(1);
  return row ?? null;
}

export async function createSubTaskCategory(
  input: SubTaskCategoryFormInput,
  db: Db = getDb(),
) {
  const [created] = await db
    .insert(subTaskCategories)
    .values({
      name: input.name,
      description: input.description?.trim() ? input.description : null,
      ref: input.ref,
    })
    .returning();
  return created;
}

export async function updateSubTaskCategory(
  id: string,
  input: SubTaskCategoryFormInput,
  db: Db = getDb(),
) {
  const [updated] = await db
    .update(subTaskCategories)
    .set({
      name: input.name,
      description: input.description?.trim() ? input.description : null,
      ref: input.ref,
      updatedAt: new Date(),
    })
    .where(eq(subTaskCategories.id, id))
    .returning();
  if (!updated) throw new Error("notFound");
  return updated;
}

export async function deleteSubTaskCategory(id: string, db: Db = getDb()) {
  const [{ flagCount }] = await db
    .select({ flagCount: count() })
    .from(flags)
    .where(eq(flags.subTaskCategoryId, id));
  if (Number(flagCount) > 0) throw new Error("categoryHasFlags");

  const [{ subCount }] = await db
    .select({ subCount: count() })
    .from(subTasks)
    .where(eq(subTasks.subTaskCategoryId, id));
  const [{ presetCount }] = await db
    .select({ presetCount: count() })
    .from(subTaskPresets)
    .where(eq(subTaskPresets.subTaskCategoryId, id));
  const [{ templateCount }] = await db
    .select({ templateCount: count() })
    .from(templateSubTasks)
    .where(eq(templateSubTasks.subTaskCategoryId, id));
  if (
    Number(subCount) > 0 ||
    Number(presetCount) > 0 ||
    Number(templateCount) > 0
  ) {
    throw new Error("categoryInUse");
  }

  await db.delete(subTaskCategories).where(eq(subTaskCategories.id, id));
}
