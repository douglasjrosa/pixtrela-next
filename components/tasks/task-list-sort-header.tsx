"use client";

import { ArrowDown, ArrowUp } from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  TaskListSort,
  TaskListSortColumn,
} from "@/lib/schemas/task-list-sort";

export interface TaskListSortHeaderProps {
  column: TaskListSortColumn;
  label: string;
  sort: TaskListSort;
  className?: string;
  onSort: (column: TaskListSortColumn) => void;
}

export function TaskListSortHeader({
  column,
  label,
  sort,
  className,
  onSort,
}: TaskListSortHeaderProps) {
  const active = sort.column === column;
  const direction = active ? sort.direction : undefined;

  return (
    <th className={cn("py-2", className)}>
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1 rounded-sm text-left font-medium",
          "hover:text-foreground focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-ring",
          active ? "text-foreground" : "text-muted-foreground",
        )}
        aria-sort={
          active ? (direction === "asc" ? "ascending" : "descending") : "none"
        }
        onClick={() => onSort(column)}
      >
        <span>{label}</span>
        {active ? (
          direction === "asc" ? (
            <ArrowUp className="size-3.5 shrink-0" aria-hidden />
          ) : (
            <ArrowDown className="size-3.5 shrink-0" aria-hidden />
          )
        ) : null}
      </button>
    </th>
  );
}
