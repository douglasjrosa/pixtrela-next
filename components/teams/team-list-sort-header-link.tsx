import type { ReactNode } from "react";

import { ListSortHeaderLink } from "@/components/ui/list-sort-header-link";
import { cn } from "@/lib/utils";
import type { TeamListFilters } from "@/lib/schemas/team-list-filters";
import type {
  TeamListSort,
  TeamListSortColumn,
} from "@/lib/schemas/team-list-sort";
import { buildTeamListSortHref } from "@/lib/teams/team-list-sort-url";

export interface TeamListSortHeaderLinkProps {
  column: TeamListSortColumn;
  label: ReactNode;
  sort: TeamListSort;
  filters: TeamListFilters;
  align?: "left" | "center";
  className?: string;
  linkClassName?: string;
}

export function TeamListSortHeaderLink({
  column,
  label,
  sort,
  filters,
  align = "left",
  className,
  linkClassName,
}: TeamListSortHeaderLinkProps) {
  const active = sort.column === column;
  const direction = active ? sort.direction : undefined;
  const href = buildTeamListSortHref(filters, column);

  return (
    <ListSortHeaderLink
      href={href}
      label={label}
      active={active}
      direction={direction}
      align={align}
      className={cn("px-2 align-middle", className)}
      linkClassName={linkClassName}
    />
  );
}
