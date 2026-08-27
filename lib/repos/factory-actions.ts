import { asc, count, desc, eq, ilike } from "drizzle-orm";

import { factoryActions, subTaskPresets } from "@/drizzle/schema";
import {
  parseActionUnitTime,
  type FactoryAction,
} from "@/lib/business/factory-action";
import { getDb, type Db } from "@/lib/db/client";
import type { FactoryActionFormInput } from "@/lib/schemas/factory-action";
import type { FactoryActionListSort } from "@/lib/schemas/factory-action-list-sort";

export const FACTORY_ACTION_SEARCH_LIMIT = 10;
export const FACTORY_ACTION_LIST_LIMIT = 100;

function mapActionRow(
  row: typeof factoryActions.$inferSelect,
): FactoryAction {
  return {
    documentId: row.id,
    name: row.name,
    unitTime: parseActionUnitTime(row.unitTime),
    description: row.description,
    qtyQuestion: row.qtyQuestion,
  };
}

function actionListOrderBy(sort: FactoryActionListSort) {
  const dir = sort.direction === "desc" ? desc : asc;
  if (sort.column === "unitTime") {
    return [
      dir(factoryActions.unitTime),
      asc(factoryActions.name),
      asc(factoryActions.id),
    ];
  }
  if (sort.column === "qtyQuestion") {
    return [
      dir(factoryActions.qtyQuestion),
      asc(factoryActions.name),
      asc(factoryActions.id),
    ];
  }
  return [dir(factoryActions.name), asc(factoryActions.id)];
}

export async function searchFactoryActionsByName(
  query: string,
  db: Db = getDb(),
): Promise<FactoryAction[]> {
  const rows = await db
    .select()
    .from(factoryActions)
    .where(ilike(factoryActions.name, `%${query.trim()}%`))
    .orderBy(asc(factoryActions.name))
    .limit(FACTORY_ACTION_SEARCH_LIMIT);
  return rows.map(mapActionRow);
}

export async function getFactoryActionById(
  id: string,
  db: Db = getDb(),
): Promise<FactoryAction | null> {
  const [row] = await db
    .select()
    .from(factoryActions)
    .where(eq(factoryActions.id, id))
    .limit(1);
  return row ? mapActionRow(row) : null;
}

export async function listFactoryActionsPaged(
  options: {
    page?: number;
    pageSize?: number;
    sort?: FactoryActionListSort;
  } = {},
  db: Db = getDb(),
): Promise<{ items: FactoryAction[]; total: number }> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.max(1, options.pageSize ?? 10);
  const offset = (page - 1) * pageSize;
  const sort = options.sort ?? { column: "name", direction: "asc" };

  const [totalRow] = await db
    .select({ total: count() })
    .from(factoryActions);

  const rows = await db
    .select()
    .from(factoryActions)
    .orderBy(...actionListOrderBy(sort))
    .limit(pageSize)
    .offset(offset);

  return {
    items: rows.map(mapActionRow),
    total: totalRow?.total ?? 0,
  };
}

export async function createFactoryActionRepo(
  input: FactoryActionFormInput,
  db: Db = getDb(),
): Promise<string> {
  const [row] = await db
    .insert(factoryActions)
    .values({
      name: input.name.trim(),
      description: input.description.trim(),
      unitTime: String(input.unitTime),
      qtyQuestion: input.qtyQuestion.trim(),
    })
    .returning({ id: factoryActions.id });
  return row.id;
}

export async function updateFactoryActionRepo(
  id: string,
  input: FactoryActionFormInput,
  db: Db = getDb(),
): Promise<void> {
  await db
    .update(factoryActions)
    .set({
      name: input.name.trim(),
      description: input.description.trim(),
      unitTime: String(input.unitTime),
      qtyQuestion: input.qtyQuestion.trim(),
      updatedAt: new Date(),
    })
    .where(eq(factoryActions.id, id));
}

export async function deleteFactoryActionById(
  id: string,
  db: Db = getDb(),
): Promise<void> {
  const [{ presetCount }] = await db
    .select({ presetCount: count() })
    .from(subTaskPresets)
    .where(eq(subTaskPresets.actionId, id));
  if (Number(presetCount) > 0) {
    throw new Error("actionInUse");
  }
  await db.delete(factoryActions).where(eq(factoryActions.id, id));
}
