import {
  nextActivityListSort,
  type ActivityListSortColumn,
} from "@/lib/schemas/activity-list-sort";
import type { ActivityListFilters } from "@/lib/schemas/activity-list-filters";

import { serializeActivityListSearchParams } from "./activity-list-params";

export type ActivityListUrlOptions = {
  now?: Date;
};

export function buildActivityListHref(
  filters: ActivityListFilters,
  options: ActivityListUrlOptions = {},
): string {
  const params = serializeActivityListSearchParams(filters, options.now);
  const query = params.toString();
  return query ? `/activities?${query}` : "/activities";
}

export function buildActivityListSortHref(
  filters: ActivityListFilters,
  column: ActivityListSortColumn,
  options: ActivityListUrlOptions = {},
): string {
  const next = nextActivityListSort(
    { column: filters.column, direction: filters.direction },
    column,
  );
  return buildActivityListHref(
    {
      ...filters,
      column: next.column,
      direction: next.direction,
    },
    options,
  );
}
