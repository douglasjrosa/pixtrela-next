import {
  subtaskPresetListFiltersSchema,
  type SubtaskPresetListFilters,
} from "@/lib/schemas/subtask-preset-list-filters";
import {
  isDefaultSubtaskPresetListSort,
  SUBTASK_PRESET_LIST_DEFAULT_SORT_COLUMN,
  SUBTASK_PRESET_LIST_DEFAULT_SORT_DIRECTION,
  SUBTASK_PRESET_LIST_SORT_COLUMNS,
  SUBTASK_PRESET_LIST_SORT_DIRECTIONS,
} from "@/lib/schemas/subtask-preset-list-sort";

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

export function defaultSubtaskPresetListFilters(): SubtaskPresetListFilters {
  return subtaskPresetListFiltersSchema.parse({});
}

function parseSortColumn(
  raw: string | undefined,
): (typeof SUBTASK_PRESET_LIST_SORT_COLUMNS)[number] | undefined {
  if (!raw?.trim()) return undefined;
  return SUBTASK_PRESET_LIST_SORT_COLUMNS.find(
    (column) => column === raw.trim(),
  );
}

function parseSortDirection(
  raw: string | undefined,
): (typeof SUBTASK_PRESET_LIST_SORT_DIRECTIONS)[number] | undefined {
  if (!raw?.trim()) return undefined;
  return SUBTASK_PRESET_LIST_SORT_DIRECTIONS.find(
    (direction) => direction === raw.trim(),
  );
}

export function parseSubtaskPresetListSearchParams(
  params: SearchParamsRecord,
): SubtaskPresetListFilters {
  const qRaw = firstParam(params.q)?.trim();
  const sortColumn = parseSortColumn(firstParam(params.sort));
  const sortDirection = parseSortDirection(firstParam(params.dir));
  const showArchived = firstParam(params.archived) === "1";

  const result = subtaskPresetListFiltersSchema.safeParse({
    q:
      qRaw && qRaw.length >= 3
        ? qRaw
        : undefined,
    column: sortColumn ?? SUBTASK_PRESET_LIST_DEFAULT_SORT_COLUMN,
    direction: sortDirection ?? SUBTASK_PRESET_LIST_DEFAULT_SORT_DIRECTION,
    showArchived,
  });

  if (!result.success) {
    return defaultSubtaskPresetListFilters();
  }
  return result.data;
}

export function serializeSubtaskPresetListSearchParams(
  filters: SubtaskPresetListFilters,
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) {
    params.set("q", filters.q);
  }
  if (filters.showArchived) {
    params.set("archived", "1");
  }
  if (
    !isDefaultSubtaskPresetListSort({
      column: filters.column,
      direction: filters.direction,
    })
  ) {
    params.set("sort", filters.column);
    params.set("dir", filters.direction);
  }
  return params;
}

export function subtaskPresetListFilterKey(
  filters: SubtaskPresetListFilters,
): string {
  return [
    filters.q ?? "",
    filters.column,
    filters.direction,
    filters.showArchived ? "1" : "0",
  ].join("|");
}
