import { toCalendarDateKey } from "@/lib/business/datetime-timezone";
import {
  LOG_LIST_LOOKBACK_DAYS,
  LOG_QUERY_MIN_CHARS,
} from "@/lib/logs/constants";
import { isTrackedLogRoute } from "@/lib/logs/tracked-routes";
import {
  logListFiltersSchema,
  type LogListFilters,
} from "@/lib/schemas/log-list-filters";

export type SearchParamsRecord = Record<string, string | string[] | undefined>;

const DEFAULT_DIRECTION = "desc";
const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function shiftCalendarDate(key: string, days: number): string {
  const match = CALENDAR_DATE.exec(key);
  if (!match) return key;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Default `to` = today in the app time zone. */
export function defaultLogListTo(now: Date = new Date()): string {
  return toCalendarDateKey(now);
}

/** Default `from` = today minus the lookback window. */
export function defaultLogListFrom(now: Date = new Date()): string {
  return shiftCalendarDate(defaultLogListTo(now), -LOG_LIST_LOOKBACK_DAYS);
}

export function defaultLogListFilters(now: Date = new Date()): LogListFilters {
  return logListFiltersSchema.parse({
    from: defaultLogListFrom(now),
    to: defaultLogListTo(now),
    direction: DEFAULT_DIRECTION,
  });
}

export function parseLogListSearchParams(
  params: SearchParamsRecord,
  now: Date = new Date(),
): LogListFilters {
  const qRaw = firstParam(params.q)?.trim();
  const routeRaw = firstParam(params.route)?.trim() ?? "";
  const direction = firstParam(params.dir) === "asc" ? "asc" : DEFAULT_DIRECTION;
  const from = firstParam(params.from)?.trim() || defaultLogListFrom(now);
  const to = firstParam(params.to)?.trim() || defaultLogListTo(now);
  const result = logListFiltersSchema.safeParse({
    actor: firstParam(params.actor)?.trim() || undefined,
    route: isTrackedLogRoute(routeRaw) ? routeRaw : undefined,
    from,
    to,
    q: qRaw && qRaw.length >= LOG_QUERY_MIN_CHARS ? qRaw : undefined,
    direction,
  });
  if (!result.success) return defaultLogListFilters(now);
  return {
    ...result.data,
    from,
    to,
  };
}

export function serializeLogListSearchParams(
  filters: LogListFilters,
  now: Date = new Date(),
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.actor) params.set("actor", filters.actor);
  if (filters.route) params.set("route", filters.route);
  if (filters.from && filters.from !== defaultLogListFrom(now)) {
    params.set("from", filters.from);
  }
  if (filters.to && filters.to !== defaultLogListTo(now)) {
    params.set("to", filters.to);
  }
  if (filters.q) params.set("q", filters.q);
  if (filters.direction !== DEFAULT_DIRECTION) {
    params.set("dir", filters.direction);
  }
  return params;
}

export function logListFilterKey(filters: LogListFilters): string {
  return [
    filters.actor ?? "",
    filters.route ?? "",
    filters.from ?? "",
    filters.to ?? "",
    filters.q ?? "",
    filters.direction,
  ].join("|");
}

export function buildLogListHref(
  filters: LogListFilters,
  now: Date = new Date(),
): string {
  const query = serializeLogListSearchParams(filters, now).toString();
  return query ? `/settings/logs?${query}` : "/settings/logs";
}

export function buildLogListSortHref(
  filters: LogListFilters,
  now: Date = new Date(),
): string {
  const direction = filters.direction === "asc" ? "desc" : "asc";
  return buildLogListHref({ ...filters, direction }, now);
}
