"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";

import {
  LIST_SORT_HEADER_LINK_BASE_CLASS,
  listSortHeaderLinkClass,
} from "@/lib/ui/table-head-styles";
import { cn } from "@/lib/utils";
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
    <th
      className={cn(
        "py-2",
        align === "center" ? "text-center" : "text-left",
      )}
    >
      <Link
        href={href}
        scroll={false}
        className={cn(
          LIST_SORT_HEADER_LINK_BASE_CLASS,
          listSortHeaderLinkClass(active),
          align === "center" ? "justify-center" : "justify-start",
        )}
        aria-sort={
          active ? (direction === "asc" ? "ascending" : "descending") : "none"
        }
      >
        <span>{label}</span>
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
