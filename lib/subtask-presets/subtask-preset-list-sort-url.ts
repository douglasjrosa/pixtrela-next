import {
  nextSubtaskPresetListSort,
  type SubtaskPresetListSortColumn,
} from "@/lib/schemas/subtask-preset-list-sort";
import type { SubtaskPresetListFilters } from "@/lib/schemas/subtask-preset-list-filters";

import { serializeSubtaskPresetListSearchParams } from "./subtask-preset-list-params";

export const TEMPLATES_SUBTASKS_LIST_PATH = "/templates/subtasks";

/**
 * Builds a `/templates/subtasks` href that toggles sort for the given column.
 */
export function buildSubtaskPresetListSortHref(
  filters: SubtaskPresetListFilters,
  column: SubtaskPresetListSortColumn,
): string {
  const next = nextSubtaskPresetListSort(
    { column: filters.column, direction: filters.direction },
    column,
  );
  return buildSubtaskPresetListHref({
    ...filters,
    column: next.column,
    direction: next.direction,
  });
}

/**
 * Builds a `/templates/subtasks` href from current filters.
 */
export function buildSubtaskPresetListHref(
  filters: SubtaskPresetListFilters,
): string {
  const params = serializeSubtaskPresetListSearchParams(filters);
  const query = params.toString();
  return query
    ? `${TEMPLATES_SUBTASKS_LIST_PATH}?${query}`
    : TEMPLATES_SUBTASKS_LIST_PATH;
}
