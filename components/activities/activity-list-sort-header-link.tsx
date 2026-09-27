"use client";

import { ListSortHeaderLink } from "@/components/ui/list-sort-header-link";
import type { ActivityListFilters } from "@/lib/schemas/activity-list-filters";
import type {
  ActivityListSort,
  ActivityListSortColumn,
} from "@/lib/schemas/activity-list-sort";
import { buildActivityListSortHref } from "@/lib/activities/activity-list-sort-url";

export interface ActivityListSortHeaderLinkProps {
  column: ActivityListSortColumn;
  label: string;
  sort: ActivityListSort;
  filters: ActivityListFilters;
  align?: "left" | "center";
}

export function ActivityListSortHeaderLink({
  column,
  label,
  sort,
  filters,
  align = "left",
}: ActivityListSortHeaderLinkProps) {
  const active = sort.column === column;
  const direction = active ? sort.direction : undefined;
  const href = buildActivityListSortHref(filters, column);

  return (
    <ListSortHeaderLink
      href={href}
      label={label}
      active={active}
      direction={direction}
      align={align}
    />
  );
}
