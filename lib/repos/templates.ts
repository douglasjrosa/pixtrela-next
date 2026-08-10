import { and, asc, count, eq, ilike, or, sql } from "drizzle-orm";

import { templateSubTasks, templateTasks } from "@/drizzle/schema";
import { getDb, type Db } from "@/lib/db/client";

export type TemplateTaskRecord = {
  id: string;
  code: string;
  name: string;
  active: boolean;
};

export type TemplateSubTaskInput = {
  name: string;
  qty?: number;
  index?: number;
  expectedTime?: number;
  sharingType?: "qty" | "duration";
  maxSameTimeWorkers?: number;
  dependencyIndexes?: number[];
};

export type TemplateTaskListItem = TemplateTaskRecord & {
  subTaskCount: number;
};

const TEMPLATE_COLUMNS = {
  id: templateTasks.id,
  code: templateTasks.code,
  name: templateTasks.name,
  active: templateTasks.active,
} as const;

function mapSubTaskValues(
  templateTaskId: string,
  subTasks: TemplateSubTaskInput[],
) {
  return subTasks.map((sub, index) => ({
    templateTaskId,
    name: sub.name,
    qty: sub.qty ?? 1,
    index: sub.index ?? index,
    expectedTime: sub.expectedTime ?? 0,
    sharingType: sub.sharingType ?? ("duration" as const),
    maxSameTimeWorkers: sub.maxSameTimeWorkers ?? 1,
    dependencyIndexes: sub.dependencyIndexes ?? [],
  }));
}

export async function createTemplateTask(
  input: {
    code: string;
    name: string;
    subTasks?: TemplateSubTaskInput[];
  },
  db: Db = getDb(),
): Promise<TemplateTaskRecord> {
  const [row] = await db
    .insert(templateTasks)
    .values({
      code: input.code.trim(),
      name: input.name.trim(),
    })
    .returning(TEMPLATE_COLUMNS);

  if (input.subTasks?.length) {
    await db
      .insert(templateSubTasks)
      .values(mapSubTaskValues(row.id, input.subTasks));
  }

  return row;
}

export async function findTemplateByCode(
  code: string,
  db: Db = getDb(),
): Promise<TemplateTaskRecord | null> {
  const [row] = await db
    .select(TEMPLATE_COLUMNS)
    .from(templateTasks)
    .where(eq(templateTasks.code, code.trim()))
    .limit(1);
  return row ?? null;
}

export async function findTemplateById(
  id: string,
  db: Db = getDb(),
): Promise<TemplateTaskRecord | null> {
  const [row] = await db
    .select(TEMPLATE_COLUMNS)
    .from(templateTasks)
    .where(eq(templateTasks.id, id))
    .limit(1);
  return row ?? null;
}

export async function listTemplateSubTasks(
  templateTaskId: string,
  db: Db = getDb(),
) {
  return db
    .select()
    .from(templateSubTasks)
    .where(eq(templateSubTasks.templateTaskId, templateTaskId))
    .orderBy(asc(templateSubTasks.index));
}

export async function listTemplateTasks(
  options: { q?: string; page?: number; pageSize?: number } = {},
  db: Db = getDb(),
): Promise<{ items: TemplateTaskListItem[]; total: number }> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.max(1, options.pageSize ?? 10);
  const offset = (page - 1) * pageSize;
  const q = options.q?.trim();

  const where = q
    ? and(
        eq(templateTasks.active, true),
        or(
          ilike(templateTasks.name, `%${q}%`),
          ilike(templateTasks.code, `%${q}%`),
        ),
      )
    : eq(templateTasks.active, true);

  const [totalRow] = await db
    .select({ total: count() })
    .from(templateTasks)
    .where(where);

  const rows = await db
    .select({
      id: templateTasks.id,
      code: templateTasks.code,
      name: templateTasks.name,
      active: templateTasks.active,
      subTaskCount: sql<number>`coalesce(count(${templateSubTasks.id}), 0)`,
    })
    .from(templateTasks)
    .leftJoin(
      templateSubTasks,
      eq(templateSubTasks.templateTaskId, templateTasks.id),
    )
    .where(where)
    .groupBy(
      templateTasks.id,
      templateTasks.code,
      templateTasks.name,
      templateTasks.active,
    )
    .orderBy(asc(templateTasks.name))
    .limit(pageSize)
    .offset(offset);

  return {
    items: rows.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      active: row.active,
      subTaskCount: Number(row.subTaskCount),
    })),
    total: totalRow?.total ?? 0,
  };
}

export async function updateTemplateTask(
  input: {
    id: string;
    name: string;
    code: string;
    subTasks?: TemplateSubTaskInput[];
  },
  db: Db = getDb(),
): Promise<TemplateTaskRecord> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(templateTasks)
      .set({
        name: input.name.trim(),
        code: input.code.trim(),
        updatedAt: new Date(),
      })
      .where(eq(templateTasks.id, input.id))
      .returning(TEMPLATE_COLUMNS);
    if (!row) throw new Error("templateNotFound");

    if (input.subTasks) {
      await tx
        .delete(templateSubTasks)
        .where(eq(templateSubTasks.templateTaskId, input.id));
      if (input.subTasks.length > 0) {
        await tx
          .insert(templateSubTasks)
          .values(mapSubTaskValues(input.id, input.subTasks));
      }
    }

    return row;
  });
}

export async function deleteTemplateTask(
  id: string,
  db: Db = getDb(),
): Promise<void> {
  await db
    .update(templateTasks)
    .set({ active: false, updatedAt: new Date() })
    .where(eq(templateTasks.id, id));
}
