import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
  or,
  sql,
} from "drizzle-orm";

import { logs, users } from "@/drizzle/schema";
import { DEFAULT_TIME_ZONE } from "@/lib/business/datetime-timezone";
import { getDb, type Db } from "@/lib/db/client";
import { LOG_ACTOR_SYSTEM, LOG_PAGE_SIZE } from "@/lib/logs/constants";
import type { LogListFilters } from "@/lib/schemas/log-list-filters";

export type LogListItem = {
  id: string;
  userId: string | null;
  userLabel: string | null;
  route: string;
  description: string;
  detail: string | null;
  count: number;
  createdAt: Date;
};

export type LogActorOption = {
  id: string;
  label: string;
};

const ACTOR_OPTION_LIMIT = 100;

function userLabelSql() {
  return sql<string | null>`coalesce(
    nullif(trim(concat(${users.name}, ' ', coalesce(${users.lastName}, ''))), ''),
    ${users.username}
  )`;
}

function dateBounds(filters: LogListFilters) {
  const parts = [];
  if (filters.from) {
    parts.push(
      gte(
        sql`(${logs.createdAt} at time zone ${DEFAULT_TIME_ZONE})::date`,
        filters.from,
      ),
    );
  }
  if (filters.to) {
    parts.push(
      lte(
        sql`(${logs.createdAt} at time zone ${DEFAULT_TIME_ZONE})::date`,
        filters.to,
      ),
    );
  }
  return parts;
}

function filterWhere(filters: LogListFilters) {
  const parts = [...dateBounds(filters)];
  if (filters.actor === LOG_ACTOR_SYSTEM) {
    parts.push(isNull(logs.userId));
  } else if (filters.actor) {
    parts.push(eq(logs.userId, filters.actor));
  }
  if (filters.route) {
    parts.push(ilike(logs.route, `%${filters.route}%`));
  }
  if (filters.q) {
    const textMatch = or(
      ilike(logs.description, `%${filters.q}%`),
      ilike(logs.detail, `%${filters.q}%`),
    );
    if (textMatch) parts.push(textMatch);
  }
  return parts.length > 0 ? and(...parts) : undefined;
}

export async function listLogs(
  filters: LogListFilters,
  page: number,
  db: Db = getDb(),
): Promise<{ items: LogListItem[]; total: number }> {
  const where = filterWhere(filters);
  const offset = Math.max(0, page - 1) * LOG_PAGE_SIZE;
  const order =
    filters.direction === "asc" ? asc(logs.createdAt) : desc(logs.createdAt);
  const [totalRow] = await db
    .select({ total: count() })
    .from(logs)
    .where(where);
  const rows = await db
    .select({
      id: logs.id,
      userId: logs.userId,
      userLabel: userLabelSql(),
      route: logs.route,
      description: logs.description,
      detail: logs.detail,
      count: logs.count,
      createdAt: logs.createdAt,
    })
    .from(logs)
    .leftJoin(users, eq(users.id, logs.userId))
    .where(where)
    .orderBy(order, desc(logs.id))
    .limit(LOG_PAGE_SIZE)
    .offset(offset);
  return { items: rows, total: totalRow?.total ?? 0 };
}

export async function listLogActorOptions(
  db: Db = getDb(),
): Promise<LogActorOption[]> {
  const rows = await db
    .select({
      id: logs.userId,
      label: userLabelSql(),
    })
    .from(logs)
    .leftJoin(users, eq(users.id, logs.userId))
    .groupBy(logs.userId, users.name, users.lastName, users.username)
    .limit(ACTOR_OPTION_LIMIT);
  return rows.map((row) => ({
    id: row.id ?? LOG_ACTOR_SYSTEM,
    label: row.label ?? LOG_ACTOR_SYSTEM,
  }));
}

export async function deleteLogsByIds(
  ids: string[],
  db: Db = getDb(),
): Promise<void> {
  if (ids.length === 0) return;
  await db.delete(logs).where(inArray(logs.id, ids));
}
