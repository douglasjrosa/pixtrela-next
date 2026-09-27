import { ListSortHeaderLink } from "@/components/ui/list-sort-header-link";
import type { TaskListFilters } from "@/lib/schemas/task-list-filters";
import type {
  TaskListSort,
  TaskListSortColumn,
} from "@/lib/schemas/task-list-sort";
import { buildTaskListSortHref } from "@/lib/tasks/task-list-sort-url";

export interface TaskListSortHeaderLinkProps {
  column: TaskListSortColumn;
  label: string;
  sort: TaskListSort;
  filters: TaskListFilters;
  align?: "left" | "center";
  className?: string;
}

export function TaskListSortHeaderLink({
  column,
  label,
  sort,
  filters,
  align = "left",
  className,
}: TaskListSortHeaderLinkProps) {
  const active = sort.column === column;
  const direction = active ? sort.direction : undefined;
  const href = buildTaskListSortHref(filters, column);

  return (
    <ListSortHeaderLink
      href={href}
      label={label}
      active={active}
      direction={direction}
      align={align}
      className={className}
    />
  );
}
