import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";

import {
  LIST_SORT_HEADER_LINK_BASE_CLASS,
  listSortHeaderLinkClass,
} from "@/lib/ui/table-head-styles";
import { cn } from "@/lib/utils";
import type {
  FactoryActionListSort,
  FactoryActionListSortColumn,
} from "@/lib/schemas/factory-action-list-sort";
import type { FactoryActionListFilters } from "@/lib/schemas/factory-action-list-filters";
import { buildFactoryActionListSortHref } from "@/lib/factory-actions/factory-action-list-sort-url";

export interface FactoryActionListSortHeaderLinkProps {
  column: FactoryActionListSortColumn;
  label: string;
  sort: FactoryActionListSort;
  filters: FactoryActionListFilters;
  align?: "left" | "center";
}

export function FactoryActionListSortHeaderLink({
  column,
  label,
  sort,
  filters,
  align = "left",
}: FactoryActionListSortHeaderLinkProps) {
  const active = sort.column === column;
  const direction = active ? sort.direction : undefined;
  const href = buildFactoryActionListSortHref(filters, column);

  return (
    <th
      className={cn("py-2", align === "center" ? "text-center" : "text-left")}
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
