import type { ReactNode } from "react";

import { ListSortHeaderLink } from "@/components/ui/list-sort-header-link";
import type { WorkdayListFilters } from "@/lib/schemas/workday-list-filters";
import type {
  WorkdayListSort,
  WorkdayListSortColumn,
} from "@/lib/schemas/workday-list-sort";
import { cn } from "@/lib/utils";
import { buildWorkdayListSortHref } from "@/lib/workdays/workday-list-sort-url";

export interface WorkdayListSortHeaderLinkProps {
  column: WorkdayListSortColumn;
  label: ReactNode;
  sort: WorkdayListSort;
  filters: WorkdayListFilters;
  align?: "left" | "center";
  className?: string;
}

export function WorkdayListSortHeaderLink({
  column,
  label,
  sort,
  filters,
  align = "left",
  className,
}: WorkdayListSortHeaderLinkProps) {
  const active = sort.column === column;
  const direction = active ? sort.direction : undefined;
  const href = buildWorkdayListSortHref(filters, column);

  return (
    <ListSortHeaderLink
      href={href}
      label={label}
      active={active}
      direction={direction}
      align={align}
      className={cn("px-2 align-middle", className)}
    />
  );
}
