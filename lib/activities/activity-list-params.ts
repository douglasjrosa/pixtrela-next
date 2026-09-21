import {
  ACTIVITY_LIST_DEFAULT_LOOKBACK_DAYS,
  ACTIVITY_LIST_NAME_MIN_CHARS,
  activityListFiltersSchema,
  type ActivityListFilters,
} from "@/lib/schemas/activity-list-filters";
import {
  ACTIVITY_LIST_DEFAULT_SORT_COLUMN,
  ACTIVITY_LIST_DEFAULT_SORT_DIRECTION,
  ACTIVITY_LIST_SORT_COLUMNS,
  ACTIVITY_LIST_SORT_DIRECTIONS,
  isDefaultActivityListSort,
} from "@/lib/schemas/activity-list-sort";
import { ACTIVITY_ACTIONS } from "@/lib/schemas/activity";

import { formatDateOnly } from "@/lib/tasks/task-list-params";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type SearchParamsRecord = Record<
  string,
  string | string[] | undefined
>;

function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/** Default `from` = today minus lookback days (local calendar). */
export function defaultActivityListFrom(now: Date = new Date()): string {
  const from = new Date(now.getTime());
  from.setHours(0, 0, 0, 0);
  from.setTime(from.getTime() - ACTIVITY_LIST_DEFAULT_LOOKBACK_DAYS * MS_PER_DAY);
  return formatDateOnly(from);
}

/** Default `to` = today (no future lookahead). */
export function defaultActivityListTo(now: Date = new Date()): string {
  const to = new Date(now.getTime());
  to.setHours(0, 0, 0, 0);
  return formatDateOnly(to);
}

export function defaultActivityListFilters(
  now: Date = new Date(),
): ActivityListFilters {
  return activityListFiltersSchema.parse({
    actions: [...ACTIVITY_ACTIONS],
    from: defaultActivityListFrom(now),
    to: defaultActivityListTo(now),
    showArchived: false,
  });
}

function parseActionsCsv(raw: string | undefined): string[] | undefined {
  if (!raw?.trim()) return undefined;
  const allowed = new Set<string>(ACTIVITY_ACTIONS);
  const values = raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => allowed.has(part));
  return values.length > 0 ? values : undefined;
}

function parseSortColumn(
  raw: string | undefined,
): (typeof ACTIVITY_LIST_SORT_COLUMNS)[number] | undefined {
  if (!raw?.trim()) return undefined;
  return ACTIVITY_LIST_SORT_COLUMNS.find((column) => column === raw.trim());
}

function parseSortDirection(
  raw: string | undefined,
): (typeof ACTIVITY_LIST_SORT_DIRECTIONS)[number] | undefined {
  if (!raw?.trim()) return undefined;
  return ACTIVITY_LIST_SORT_DIRECTIONS.find(
    (direction) => direction === raw.trim(),
  );
}

/**
 * Parses URL search params into activity list filters.
 * Missing params use defaults (both actions, from = today−30, to = today).
 */
export function parseActivityListSearchParams(
  params: SearchParamsRecord,
  now: Date = new Date(),
): ActivityListFilters {
  const actions = parseActionsCsv(firstParam(params.action));
  const from = firstParam(params.from)?.trim() || defaultActivityListFrom(now);
  const toRaw = firstParam(params.to)?.trim();
  const qRaw = firstParam(params.q)?.trim();
  const showArchived = firstParam(params.archived) === "1";
  const sortColumn = parseSortColumn(firstParam(params.sort));
  const sortDirection = parseSortDirection(firstParam(params.dir));

  const result = activityListFiltersSchema.safeParse({
    actions: actions ?? [...ACTIVITY_ACTIONS],
    from,
    to: toRaw || defaultActivityListTo(now),
    q: qRaw && qRaw.length >= ACTIVITY_LIST_NAME_MIN_CHARS ? qRaw : undefined,
    showArchived,
    column: sortColumn ?? ACTIVITY_LIST_DEFAULT_SORT_COLUMN,
    direction: sortDirection ?? ACTIVITY_LIST_DEFAULT_SORT_DIRECTION,
  });

  if (!result.success) {
    return defaultActivityListFilters(now);
  }
  return result.data;
}

function sameActions(
  a: ActivityListFilters["actions"],
  b: readonly string[],
): boolean {
  if (a.length !== b.length) return false;
  const sortedB = [...b].sort();
  return a.every((value, index) => value === sortedB[index]);
}

export function isDefaultActivityListFilters(
  filters: ActivityListFilters,
  now: Date = new Date(),
): boolean {
  const defaults = defaultActivityListFilters(now);
  return (
    sameActions(filters.actions, defaults.actions) &&
    filters.from === defaults.from &&
    filters.to === defaults.to &&
    !filters.showArchived &&
    !filters.q &&
    isDefaultActivityListSort({
      column: filters.column,
      direction: filters.direction,
    })
  );
}

export function serializeActivityListSearchParams(
  filters: ActivityListFilters,
  now: Date = new Date(),
): URLSearchParams {
  const params = new URLSearchParams();
  const defaults = defaultActivityListFilters(now);

  if (!sameActions(filters.actions, defaults.actions)) {
    params.set("action", filters.actions.join(","));
  }
  if (filters.from !== defaults.from) {
    params.set("from", filters.from);
  }
  if (filters.to !== defaults.to) {
    params.set("to", filters.to);
  }
  if (filters.showArchived) {
    params.set("archived", "1");
  }
  if (filters.q) {
    params.set("q", filters.q);
  }
  if (
    !isDefaultActivityListSort({
      column: filters.column,
      direction: filters.direction,
    })
  ) {
    params.set("sort", filters.column);
    params.set("dir", filters.direction);
  }
  return params;
}

export function activityListFilterKey(filters: ActivityListFilters): string {
  return [
    filters.actions.join(","),
    filters.from,
    filters.to ?? "",
    filters.q ?? "",
    filters.showArchived ? "1" : "0",
    filters.column,
    filters.direction,
  ].join("|");
}
