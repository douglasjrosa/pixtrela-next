import {
  nextFactoryActionListSort,
  type FactoryActionListSortColumn,
} from "@/lib/schemas/factory-action-list-sort";
import type { FactoryActionListFilters } from "@/lib/schemas/factory-action-list-filters";

import { serializeFactoryActionListSearchParams } from "./factory-action-list-params";

export const TEMPLATES_ACTIONS_LIST_PATH = "/templates/actions";

export function buildFactoryActionListSortHref(
  filters: FactoryActionListFilters,
  column: FactoryActionListSortColumn,
): string {
  const next = nextFactoryActionListSort(
    { column: filters.column, direction: filters.direction },
    column,
  );
  return buildFactoryActionListHref({
    ...filters,
    column: next.column,
    direction: next.direction,
  });
}

export function buildFactoryActionListHref(
  filters: FactoryActionListFilters,
): string {
  const params = serializeFactoryActionListSearchParams(filters);
  const query = params.toString();
  return query
    ? `${TEMPLATES_ACTIONS_LIST_PATH}?${query}`
    : TEMPLATES_ACTIONS_LIST_PATH;
}
