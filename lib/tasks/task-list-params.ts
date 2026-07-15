import {
  TASK_LIST_DEFAULT_LOOKBACK_DAYS,
  TASK_LIST_DEFAULT_STATUSES,
  TASK_LIST_NAME_MIN_CHARS,
  taskListFiltersSchema,
  type TaskListFilters,
} from "@/lib/schemas/task-list-filters";
import { TASK_STATUSES } from "@/lib/schemas/task";

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

/** Formats a local calendar date as YYYY-MM-DD. */
export function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Default `from` = today minus lookback days (local calendar). */
export function defaultTaskListFrom(now: Date = new Date()): string {
  const from = new Date(now.getTime());
  from.setHours(0, 0, 0, 0);
  from.setTime(from.getTime() - TASK_LIST_DEFAULT_LOOKBACK_DAYS * MS_PER_DAY);
  return formatDateOnly(from);
}

export function defaultTaskListFilters(now: Date = new Date()): TaskListFilters {
  return taskListFiltersSchema.parse({
    statuses: [...TASK_LIST_DEFAULT_STATUSES],
    from: defaultTaskListFrom(now),
  });
}

function parseStatusesCsv(raw: string | undefined): string[] | undefined {
  if (!raw?.trim()) return undefined;
  const allowed = new Set<string>(TASK_STATUSES);
  const values = raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => allowed.has(part));
  return values.length > 0 ? values : undefined;
}

/**
 * Parses URL search params into task list filters.
 * Missing params use defaults (finished off, from = today−30, no to/q).
 */
export function parseTaskListSearchParams(
  params: SearchParamsRecord,
  now: Date = new Date(),
): TaskListFilters {
  const statuses = parseStatusesCsv(firstParam(params.status));
  const from = firstParam(params.from)?.trim() || defaultTaskListFrom(now);
  const toRaw = firstParam(params.to)?.trim();
  const qRaw = firstParam(params.q)?.trim();

  const result = taskListFiltersSchema.safeParse({
    statuses: statuses ?? [...TASK_LIST_DEFAULT_STATUSES],
    from,
    to: toRaw || undefined,
    q:
      qRaw && qRaw.length >= TASK_LIST_NAME_MIN_CHARS
        ? qRaw
        : undefined,
  });

  if (!result.success) {
    return defaultTaskListFilters(now);
  }
  return result.data;
}

function sameStatuses(
  a: TaskListFilters["statuses"],
  b: readonly string[],
): boolean {
  if (a.length !== b.length) return false;
  const sortedB = [...b].sort();
  return a.every((value, index) => value === sortedB[index]);
}

/**
 * Serializes filters to URLSearchParams, omitting values equal to defaults
 * when `now` matches the default-from calculation (cleaner `/tasks`).
 */
export function serializeTaskListSearchParams(
  filters: TaskListFilters,
  now: Date = new Date(),
): URLSearchParams {
  const params = new URLSearchParams();
  const defaults = defaultTaskListFilters(now);

  if (!sameStatuses(filters.statuses, defaults.statuses)) {
    params.set("status", filters.statuses.join(","));
  }
  if (filters.from !== defaults.from) {
    params.set("from", filters.from);
  }
  if (filters.to) {
    params.set("to", filters.to);
  }
  if (filters.q) {
    params.set("q", filters.q);
  }
  return params;
}

/** Stable key for Suspense remount when filters change. */
export function taskListFilterKey(filters: TaskListFilters): string {
  return [
    filters.statuses.join(","),
    filters.from,
    filters.to ?? "",
    filters.q ?? "",
  ].join("|");
}
