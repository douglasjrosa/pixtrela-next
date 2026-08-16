"use client";

import { useTranslations } from "next-intl";

import { ListEmptyMessage } from "@/components/ui/list-empty-message";
import { cn } from "@/lib/utils";

import type { TaskRow } from "./types";
import { TaskListRow } from "./task-list-row";

export interface TasksListViewProps {
  tasks: TaskRow[];
  selectionEnabled?: boolean;
  selectedIds?: string[];
  allSelected?: boolean;
  onToggleSelectAll?: () => void;
  onToggleSelect?: (documentId: string) => void;
}

const CHECKBOX_CLASS = cn("size-4 rounded border border-input accent-primary");

export function TasksListView({
  tasks,
  selectionEnabled = false,
  selectedIds = [],
  allSelected = false,
  onToggleSelectAll,
  onToggleSelect,
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
            <th className="py-2">{tManage("name")}</th>
            <th>{tManage("qty")}</th>
            <th>{tManage("deliveryDate")}</th>
            <th>{tManage("totalTimeSpent")}</th>
            <th>{tManage("finishedSubTasks")}</th>
            <th>{tManage("status")}</th>
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
