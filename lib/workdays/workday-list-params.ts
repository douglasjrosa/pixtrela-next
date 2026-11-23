import { WORKDAY_ACTIONS, WORKDAY_SCOPES } from "@/lib/schemas/workday";
import {
  WORKDAY_LIST_SEARCH_MIN_CHARS,
  workdayListFiltersSchema,
  type WorkdayListFilters,
} from "@/lib/schemas/workday-list-filters";
import {
  isDefaultWorkdayListSort,
  WORKDAY_LIST_DEFAULT_SORT_COLUMN,
  WORKDAY_LIST_DEFAULT_SORT_DIRECTION,
  WORKDAY_LIST_SORT_COLUMNS,
  WORKDAY_LIST_SORT_DIRECTIONS,
} from "@/lib/schemas/workday-list-sort";

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

export function defaultWorkdayListFilters(): WorkdayListFilters {
  return workdayListFiltersSchema.parse({});
}

function findEnumParam<const T extends readonly string[]>(
  allowed: T,
  raw: string | undefined,
): T[number] | undefined {
  if (!raw?.trim()) return undefined;
  return allowed.find((item) => item === raw.trim());
}

export function parseWorkdayListSearchParams(
  params: SearchParamsRecord,
): WorkdayListFilters {
  const qRaw = firstParam(params.q)?.trim();
  const action = findEnumParam(WORKDAY_ACTIONS, firstParam(params.action));
  const scope = findEnumParam(WORKDAY_SCOPES, firstParam(params.scope));
  const sortColumn = findEnumParam(
    WORKDAY_LIST_SORT_COLUMNS,
    firstParam(params.sort),
  );
  const sortDirection = findEnumParam(
    WORKDAY_LIST_SORT_DIRECTIONS,
    firstParam(params.dir),
  );
  const showArchived = firstParam(params.archived) === "1";

  const result = workdayListFiltersSchema.safeParse({
    q:
      qRaw && qRaw.length >= WORKDAY_LIST_SEARCH_MIN_CHARS ? qRaw : undefined,
    action,
    scope,
    showArchived,
    column: sortColumn ?? WORKDAY_LIST_DEFAULT_SORT_COLUMN,
    direction: sortDirection ?? WORKDAY_LIST_DEFAULT_SORT_DIRECTION,
  });

  if (!result.success) {
    return defaultWorkdayListFilters();
  }
  return result.data;
}

export function serializeWorkdayListSearchParams(
  filters: WorkdayListFilters,
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) {
    params.set("q", filters.q);
  }
  if (filters.action) {
    params.set("action", filters.action);
  }
  if (filters.scope) {
    params.set("scope", filters.scope);
  }
  if (
    !isDefaultWorkdayListSort({
      column: filters.column,
      direction: filters.direction,
    })
  ) {
    params.set("sort", filters.column);
    params.set("dir", filters.direction);
  }
  if (filters.showArchived) {
    params.set("archived", "1");
  }
  return params;
}

export function workdayListFilterKey(filters: WorkdayListFilters): string {
  return [
    filters.q ?? "",
    filters.action ?? "",
    filters.scope ?? "",
    filters.column,
    filters.direction,
    filters.showArchived ? "1" : "0",
  ].join("|");
}
