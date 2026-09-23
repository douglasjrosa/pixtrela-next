import {
  LOG_QUERY_MIN_CHARS,
} from "@/lib/logs/constants";
import {
  logListFiltersSchema,
  type LogListFilters,
} from "@/lib/schemas/log-list-filters";

export type SearchParamsRecord = Record<string, string | string[] | undefined>;

const DEFAULT_DIRECTION = "desc";

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function parseLogListSearchParams(
  params: SearchParamsRecord,
): LogListFilters {
  const qRaw = firstParam(params.q)?.trim();
  const direction = firstParam(params.dir) === "asc" ? "asc" : DEFAULT_DIRECTION;
  const result = logListFiltersSchema.safeParse({
    actor: firstParam(params.actor)?.trim() || undefined,
    route: firstParam(params.route)?.trim() || undefined,
    from: firstParam(params.from)?.trim() || undefined,
    to: firstParam(params.to)?.trim() || undefined,
    q: qRaw && qRaw.length >= LOG_QUERY_MIN_CHARS ? qRaw : undefined,
    direction,
  });
  if (!result.success) {
    return logListFiltersSchema.parse({ direction: DEFAULT_DIRECTION });
  }
  return result.data;
}

export function serializeLogListSearchParams(
  filters: LogListFilters,
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.actor) params.set("actor", filters.actor);
  if (filters.route) params.set("route", filters.route);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
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

export function buildLogListHref(filters: LogListFilters): string {
  const query = serializeLogListSearchParams(filters).toString();
  return query ? `/settings/logs?${query}` : "/settings/logs";
}

export function buildLogListSortHref(filters: LogListFilters): string {
  const direction = filters.direction === "asc" ? "desc" : "asc";
  return buildLogListHref({ ...filters, direction });
}
