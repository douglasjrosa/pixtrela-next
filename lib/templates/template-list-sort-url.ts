import {
  nextTemplateListSort,
  type TemplateListSortColumn,
} from "@/lib/schemas/template-list-sort";
import type { TemplateListFilters } from "@/lib/schemas/template-list-filters";

import { serializeTemplateListSearchParams } from "./template-list-params";

const TEMPLATES_TASKS_LIST_PATH = "/templates/tasks";

/**
 * Builds a `/templates/tasks` href that toggles sort for the given column.
 */
export function buildTemplateListSortHref(
  filters: TemplateListFilters,
  column: TemplateListSortColumn,
): string {
  const next = nextTemplateListSort(
    { column: filters.column, direction: filters.direction },
    column,
  );
  return buildTemplateListHref({
    ...filters,
    column: next.column,
    direction: next.direction,
  });
}

/**
 * Builds a `/templates/tasks` href from current filters.
 */
export function buildTemplateListHref(filters: TemplateListFilters): string {
  const params = serializeTemplateListSearchParams(filters);
  const query = params.toString();
  return query
    ? `${TEMPLATES_TASKS_LIST_PATH}?${query}`
    : TEMPLATES_TASKS_LIST_PATH;
}
