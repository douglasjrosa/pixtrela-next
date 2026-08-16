import { getTranslations } from "next-intl/server";

import { formatSpentOfExpected } from "@/lib/format/spent-of-expected";

import {
  TaskListRowPresentational,
  type TaskListRowLabels,
} from "./task-list-row-presentational";
import type { TaskRow } from "./types";

export interface TaskListRowProps {
  task: TaskRow;
  variant: "table" | "mobile";
  selectionEnabled?: boolean;
}

export async function TaskListRow({
  task,
  variant,
  selectionEnabled = false,
}: TaskListRowProps) {
  const tManage = await getTranslations("tasks.manage");
  const tStatus = await getTranslations("tasks.status");
  const tDuration = await getTranslations("duration");
  const tCommon = await getTranslations("common");

  const labels: TaskListRowLabels = {
    inactive: tManage("inactive"),
    status: tStatus(task.status),
    spentOfExpected: formatSpentOfExpected(
      task.totalTimeSpent,
      task.totalExpectedTime,
      (key, values) => tDuration(key, values),
      (spent, expected) => tManage("spentOfExpected", { spent, expected }),
    ),
    finishedSubTasks: tManage("finishedSubTasksValue", {
      finished: task.finishedSubTaskCount,
      total: task.totalSubTaskCount,
    }),
    qtyShort: tManage("qtyShort", { qty: task.qty }),
    selectRow: tCommon("selectRow", { name: task.name }),
  };

  return (
    <TaskListRowPresentational
      task={task}
      variant={variant}
      href={`/tasks/${task.documentId}`}
      labels={labels}
      selectionEnabled={selectionEnabled}
    />
  );
}
