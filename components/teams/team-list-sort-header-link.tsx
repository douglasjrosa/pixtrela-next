import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  TeamListSort,
  TeamListSortColumn,
} from "@/lib/schemas/team-list-sort";
import type { TeamListFilters } from "@/lib/schemas/team-list-filters";
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
    <th
      className={cn(
        "px-2 py-2 align-middle",
        align === "center" ? "text-center" : "text-left",
        className,
      )}
    >
      <Link
        href={href}
        scroll={false}
        className={cn(
          "flex w-full items-center gap-1 rounded-md px-2 py-1 font-medium",
          "transition-colors hover:bg-muted focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring",
          align === "center" ? "justify-center" : "justify-start",
          active ? "text-foreground" : "text-muted-foreground",
          linkClassName,
        )}
        aria-sort={
          active ? (direction === "asc" ? "ascending" : "descending") : "none"
        }
      >
        <span className={linkClassName ? "leading-tight" : undefined}>{label}</span>
        {active ? (
          direction === "asc" ? (
            <ArrowUp className="size-3.5 shrink-0" aria-hidden />
          ) : (
            <ArrowDown className="size-3.5 shrink-0" aria-hidden />
          )
        ) : null}
      </Link>
    </th>
  );
}
