import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  TaskListSort,
  TaskListSortColumn,
} from "@/lib/schemas/task-list-sort";
import type { TaskListFilters } from "@/lib/schemas/task-list-filters";
import { buildTaskListSortHref } from "@/lib/tasks/task-list-sort-url";

export interface TaskListSortHeaderLinkProps {
  column: TaskListSortColumn;
  label: string;
  sort: TaskListSort;
  filters: TaskListFilters;
  align?: "left" | "center";
  selectMode?: boolean;
  className?: string;
}

export function TaskListSortHeaderLink({
  column,
  label,
  sort,
  filters,
  align = "left",
  selectMode = false,
  className,
}: TaskListSortHeaderLinkProps) {
  const active = sort.column === column;
  const direction = active ? sort.direction : undefined;
  const href = buildTaskListSortHref(filters, column, { selectMode });

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
