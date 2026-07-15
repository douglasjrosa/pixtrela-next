"use client";

import { useTranslations } from "next-intl";

import type { TaskRow } from "./types";
import { TaskListRow } from "./task-list-row";

export interface TasksListViewProps {
  tasks: TaskRow[];
}

export function TasksListView({ tasks }: TasksListViewProps) {
  const tManage = useTranslations("tasks.manage");

  if (tasks.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-sm">{tManage("empty")}</p>
    );
  }

  return (
    <>
      <table className="hidden w-full text-sm md:table">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">{tManage("name")}</th>
            <th>{tManage("qty")}</th>
            <th>{tManage("deliveryDate")}</th>
            <th>{tManage("totalTimeSpent")}</th>
            <th>{tManage("status")}</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <TaskListRow
              key={task.documentId}
              task={task}
              variant="table"
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
          />
        ))}
      </ul>
    </>
  );
}
