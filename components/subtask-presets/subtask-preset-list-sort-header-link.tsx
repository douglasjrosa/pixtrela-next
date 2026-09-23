import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";

import {
  LIST_SORT_HEADER_LINK_BASE_CLASS,
  listSortHeaderLinkClass,
} from "@/lib/ui/table-head-styles";
import { cn } from "@/lib/utils";
import type {
  SubtaskPresetListSort,
  SubtaskPresetListSortColumn,
} from "@/lib/schemas/subtask-preset-list-sort";
import type { SubtaskPresetListFilters } from "@/lib/schemas/subtask-preset-list-filters";
import { buildSubtaskPresetListSortHref } from "@/lib/subtask-presets/subtask-preset-list-sort-url";

export interface SubtaskPresetListSortHeaderLinkProps {
  column: SubtaskPresetListSortColumn;
  label: string;
  sort: SubtaskPresetListSort;
  filters: SubtaskPresetListFilters;
  align?: "left" | "center";
  className?: string;
}

export function SubtaskPresetListSortHeaderLink({
  column,
  label,
  sort,
  filters,
  align = "left",
  className,
}: SubtaskPresetListSortHeaderLinkProps) {
  const active = sort.column === column;
  const direction = active ? sort.direction : undefined;
  const href = buildSubtaskPresetListSortHref(filters, column);

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
