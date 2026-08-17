import { fromDrizzleActivationStatus } from "@/lib/domain/subtask-activation-map";

import { filterSubTasksCountedForTask } from "./subtask-task-scope";

const FINISHED_STATUS = "finished";

export type SubTaskCompletionSnapshot = {
  taskId: string;
  status: string;
  activationStatus: string;
};

export type SubTaskCompletionCount = {
  finishedCount: number;
  totalCount: number;
};

export function countFinishedSubTasksForTask(
  rows: readonly Pick<SubTaskCompletionSnapshot, "status" | "activationStatus">[],
): SubTaskCompletionCount {
  const mapped = rows.map((row) => ({
    status: row.status,
    activationStatus: fromDrizzleActivationStatus(row.activationStatus),
  }));
  const counted = filterSubTasksCountedForTask(mapped);
  return {
    finishedCount: counted.filter((row) => row.status === FINISHED_STATUS).length,
    totalCount: counted.length,
  };
}

export function groupSubTaskCompletionCountsByTaskId(
  rows: readonly SubTaskCompletionSnapshot[],
): Map<string, SubTaskCompletionCount> {
  const byTask = new Map<
    string,
    Pick<SubTaskCompletionSnapshot, "status" | "activationStatus">[]
  >();

  for (const row of rows) {
    const bucket = byTask.get(row.taskId) ?? [];
    bucket.push({
      status: row.status,
      activationStatus: row.activationStatus,
    });
    byTask.set(row.taskId, bucket);
  }

  const result = new Map<string, SubTaskCompletionCount>();
  for (const [taskId, taskRows] of byTask) {
    result.set(taskId, countFinishedSubTasksForTask(taskRows));
  }
  return result;
}
