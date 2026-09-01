import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";

import { LIST_SORT_HEADER_LINK_CLASS } from "@/lib/ui/table-head-styles";
import { cn } from "@/lib/utils";
import type {
  TemplateListSort,
  TemplateListSortColumn,
} from "@/lib/schemas/template-list-sort";
import type { TemplateListFilters } from "@/lib/schemas/template-list-filters";
import { buildTemplateListSortHref } from "@/lib/templates/template-list-sort-url";

export interface TemplateListSortHeaderLinkProps {
  column: TemplateListSortColumn;
  label: string;
  sort: TemplateListSort;
  filters: TemplateListFilters;
  align?: "left" | "center";
  className?: string;
}

export function TemplateListSortHeaderLink({
  column,
  label,
  sort,
  filters,
  align = "left",
  className,
}: TemplateListSortHeaderLinkProps) {
  const active = sort.column === column;
  const direction = active ? sort.direction : undefined;
  const href = buildTemplateListSortHref(filters, column);

  return (
    <th
      className={cn(
        "py-2",
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
          LIST_SORT_HEADER_LINK_CLASS,
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
