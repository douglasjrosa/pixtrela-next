"use client";

import { useTranslations } from "next-intl";

import { ListEmptyMessage } from "@/components/ui/list-empty-message";
import { cn } from "@/lib/utils";
import type {
  TaskListSort,
  TaskListSortColumn,
} from "@/lib/schemas/task-list-sort";

import type { TaskRow } from "./types";
import { TaskListRow } from "./task-list-row";
import { TaskListSortHeader } from "./task-list-sort-header";

export interface TasksListViewProps {
  tasks: TaskRow[];
  sort: TaskListSort;
  selectionEnabled?: boolean;
  selectedIds?: string[];
  allSelected?: boolean;
  onToggleSelectAll?: () => void;
  onToggleSelect?: (documentId: string) => void;
  onSort?: (column: TaskListSortColumn) => void;
}

const CHECKBOX_CLASS = cn("size-4 rounded border border-input accent-primary");

export function TasksListView({
  tasks,
  sort,
  selectionEnabled = false,
  selectedIds = [],
  allSelected = false,
  onToggleSelectAll,
  onToggleSelect,
  onSort,
}: TasksListViewProps) {
  const tManage = useTranslations("tasks.manage");
  const tCommon = useTranslations("common");

  if (tasks.length === 0) {
    return <ListEmptyMessage>{tManage("empty")}</ListEmptyMessage>;
  }

  return (
    <>
      <table className="hidden w-full text-sm md:table">
        <thead>
          <tr className="border-b text-left">
            {selectionEnabled ? (
              <th className="w-10 py-2">
                <input
                  type="checkbox"
                  className={CHECKBOX_CLASS}
                  checked={allSelected}
                  aria-label={tCommon("selectAll")}
                  onChange={() => onToggleSelectAll?.()}
                />
              </th>
            ) : null}
            <TaskListSortHeader
              column="name"
              label={tManage("name")}
              sort={sort}
              onSort={(column) => onSort?.(column)}
            />
            <TaskListSortHeader
              column="qty"
              label={tManage("qty")}
              sort={sort}
              onSort={(column) => onSort?.(column)}
            />
            <TaskListSortHeader
              column="deliveryDate"
              label={tManage("deliveryDate")}
              sort={sort}
              onSort={(column) => onSort?.(column)}
            />
            <TaskListSortHeader
              column="totalTimeSpent"
              label={tManage("totalTimeSpent")}
              sort={sort}
              onSort={(column) => onSort?.(column)}
            />
            <TaskListSortHeader
              column="finishedSubTasks"
              label={tManage("finishedSubTasks")}
              sort={sort}
              onSort={(column) => onSort?.(column)}
            />
            <TaskListSortHeader
              column="status"
              label={tManage("status")}
              sort={sort}
              onSort={(column) => onSort?.(column)}
            />
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <TaskListRow
              key={task.documentId}
              task={task}
              variant="table"
              selectionEnabled={selectionEnabled}
              selected={selectedIds.includes(task.documentId)}
              onToggleSelect={() => onToggleSelect?.(task.documentId)}
            />
          ))}
        </tbody>
      </table>

      <ul className="md:hidden">
        {tasks.map((task) => (
          <TaskListRow
            key={task.documentId}
            task={task}
            variant="mobile"
            selectionEnabled={selectionEnabled}
            selected={selectedIds.includes(task.documentId)}
            onToggleSelect={() => onToggleSelect?.(task.documentId)}
          />
        ))}
      </ul>
    </>
  );
}
