import {
  TEMPLATE_LIST_SEARCH_MIN_CHARS,
  templateListFiltersSchema,
  type TemplateListFilters,
} from "@/lib/schemas/template-list-filters";
import {
  isDefaultTemplateListSort,
  TEMPLATE_LIST_DEFAULT_SORT_COLUMN,
  TEMPLATE_LIST_DEFAULT_SORT_DIRECTION,
  TEMPLATE_LIST_SORT_COLUMNS,
  TEMPLATE_LIST_SORT_DIRECTIONS,
} from "@/lib/schemas/template-list-sort";

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

export function defaultTemplateListFilters(): TemplateListFilters {
  return templateListFiltersSchema.parse({});
}

function parseSortColumn(
  raw: string | undefined,
): (typeof TEMPLATE_LIST_SORT_COLUMNS)[number] | undefined {
  if (!raw?.trim()) return undefined;
  return TEMPLATE_LIST_SORT_COLUMNS.find((column) => column === raw.trim());
}

function parseSortDirection(
  raw: string | undefined,
): (typeof TEMPLATE_LIST_SORT_DIRECTIONS)[number] | undefined {
  if (!raw?.trim()) return undefined;
  return TEMPLATE_LIST_SORT_DIRECTIONS.find(
    (direction) => direction === raw.trim(),
  );
}

/**
 * Parses URL search params into template list filters.
 * Missing params use empty defaults (no q) and default sort.
 */
export function parseTemplateListSearchParams(
  params: SearchParamsRecord,
): TemplateListFilters {
  const qRaw = firstParam(params.q)?.trim();
  const sortColumn = parseSortColumn(firstParam(params.sort));
  const sortDirection = parseSortDirection(firstParam(params.dir));

  const result = templateListFiltersSchema.safeParse({
    q:
      qRaw && qRaw.length >= TEMPLATE_LIST_SEARCH_MIN_CHARS
        ? qRaw
        : undefined,
    column: sortColumn ?? TEMPLATE_LIST_DEFAULT_SORT_COLUMN,
    direction: sortDirection ?? TEMPLATE_LIST_DEFAULT_SORT_DIRECTION,
  });

  if (!result.success) {
    return defaultTemplateListFilters();
  }
  return result.data;
}

/**
 * Serializes filters to URLSearchParams, omitting empty and default values.
 */
export function serializeTemplateListSearchParams(
  filters: TemplateListFilters,
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) {
    params.set("q", filters.q);
  }
  if (
    !isDefaultTemplateListSort({
      column: filters.column,
      direction: filters.direction,
    })
  ) {
    params.set("sort", filters.column);
    params.set("dir", filters.direction);
  }
  return params;
}

/** Stable key for remount/reset when filters or sort change. */
export function templateListFilterKey(filters: TemplateListFilters): string {
  return [filters.q ?? "", filters.column, filters.direction].join("|");
}
