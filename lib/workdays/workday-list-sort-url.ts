import type { WorkdayListFilters } from "@/lib/schemas/workday-list-filters";
import {
  nextWorkdayListSort,
  type WorkdayListSortColumn,
} from "@/lib/schemas/workday-list-sort";

import { serializeWorkdayListSearchParams } from "./workday-list-params";

export const WORKDAYS_LIST_PATH = "/workdays";

export function buildWorkdayListSortHref(
  filters: WorkdayListFilters,
  column: WorkdayListSortColumn,
): string {
  const nextSort = nextWorkdayListSort(
    { column: filters.column, direction: filters.direction },
    column,
  );
  const nextFilters: WorkdayListFilters = {
    ...filters,
    column: nextSort.column,
    direction: nextSort.direction,
  };
  const query = serializeWorkdayListSearchParams(nextFilters).toString();
  return query ? `${WORKDAYS_LIST_PATH}?${query}` : WORKDAYS_LIST_PATH;
}
