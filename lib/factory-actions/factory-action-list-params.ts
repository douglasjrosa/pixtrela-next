import {
  factoryActionListFiltersSchema,
  type FactoryActionListFilters,
} from "@/lib/schemas/factory-action-list-filters";
import {
  FACTORY_ACTION_LIST_DEFAULT_SORT_COLUMN,
  FACTORY_ACTION_LIST_DEFAULT_SORT_DIRECTION,
  FACTORY_ACTION_LIST_SORT_COLUMNS,
  FACTORY_ACTION_LIST_SORT_DIRECTIONS,
  isDefaultFactoryActionListSort,
} from "@/lib/schemas/factory-action-list-sort";

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

export function defaultFactoryActionListFilters(): FactoryActionListFilters {
  return factoryActionListFiltersSchema.parse({});
}

function parseSortColumn(
  raw: string | undefined,
): (typeof FACTORY_ACTION_LIST_SORT_COLUMNS)[number] | undefined {
  if (!raw?.trim()) return undefined;
  return FACTORY_ACTION_LIST_SORT_COLUMNS.find(
    (column) => column === raw.trim(),
  );
}

function parseSortDirection(
  raw: string | undefined,
): (typeof FACTORY_ACTION_LIST_SORT_DIRECTIONS)[number] | undefined {
  if (!raw?.trim()) return undefined;
  return FACTORY_ACTION_LIST_SORT_DIRECTIONS.find(
    (direction) => direction === raw.trim(),
  );
}

export function parseFactoryActionListSearchParams(
  params: SearchParamsRecord,
): FactoryActionListFilters {
  const sortColumn = parseSortColumn(firstParam(params.sort));
  const sortDirection = parseSortDirection(firstParam(params.dir));

  const result = factoryActionListFiltersSchema.safeParse({
    column: sortColumn ?? FACTORY_ACTION_LIST_DEFAULT_SORT_COLUMN,
    direction: sortDirection ?? FACTORY_ACTION_LIST_DEFAULT_SORT_DIRECTION,
  });

  if (!result.success) {
    return defaultFactoryActionListFilters();
  }
  return result.data;
}

export function serializeFactoryActionListSearchParams(
  filters: FactoryActionListFilters,
): URLSearchParams {
  const params = new URLSearchParams();
  if (
    !isDefaultFactoryActionListSort({
      column: filters.column,
      direction: filters.direction,
    })
  ) {
    params.set("sort", filters.column);
    params.set("dir", filters.direction);
  }
  return params;
}

export function factoryActionListFilterKey(
  filters: FactoryActionListFilters,
): string {
  return [filters.column, filters.direction].join("|");
}
