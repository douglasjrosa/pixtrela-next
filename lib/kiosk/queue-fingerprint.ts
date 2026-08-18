import type { OpenChainRun } from "@/lib/business/kiosk-queue-units";
import type { KioskSubTask } from "@/lib/business/subtask-queue";

export function buildKioskQueueFingerprint(
  subTasks: readonly KioskSubTask[],
  openRuns?: readonly OpenChainRun[],
): string {
  const tasks = subTasks
    .map((subTask) =>
      [
        subTask.documentId,
        subTask.status,
        subTask.startedAt ?? "",
        subTask.completedQty,
        subTask.timeSpent,
      ].join(":"),
    )
    .join("|");
  const runs = (openRuns ?? [])
    .map((run) => `${run.chainRunId}:${run.chainHeadId}:${run.principalId}`)
    .join("|");
  return `${tasks}#${runs}`;
}
