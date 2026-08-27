import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";

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
          "flex w-full items-center gap-1 rounded-md px-2 py-1 font-medium",
          "transition-colors hover:bg-muted focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring",
          align === "center" ? "justify-center" : "justify-start",
          active ? "text-foreground" : "text-muted-foreground",
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
