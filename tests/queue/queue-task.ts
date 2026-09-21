import type { KioskQueueUnit } from "@/lib/business/kiosk-queue-units";
import type { KioskSubTask } from "@/lib/business/subtask-queue";

/** Shared KioskSubTask factory for the Liberadas queue suite. */
export function queueTask(
  partial: Pick<KioskSubTask, "documentId" | "name" | "index"> &
    Partial<KioskSubTask>,
): KioskSubTask {
  return {
    qty: 1,
    targetQty: 1,
    completedQty: 0,
    sharingType: "duration",
    timeSpent: 0,
    startedAt: null,
    expectedTime: 10,
    taskDocumentId: "task-1",
    taskName: "Task",
    taskIndex: 0,
    finishedAt: null,
    activeWorkerCount: 0,
    status: "waiting",
    activationStatus: "unlocked",
    linkedToPrevious: false,
    maxSameTimeWorkers: 1,
    assignedToIds: ["u1"],
    dependencyIds: [],
    ...partial,
  };
}

export function startFlags(units: readonly KioskQueueUnit[]): boolean[] {
  return units.map((unit) => unit.showStart);
}

export function idleStartCount(units: readonly KioskQueueUnit[]): number {
  return units.filter((unit) => unit.showStart).length;
}

export function visibleStartIds(units: readonly KioskQueueUnit[]): string[] {
  return units.flatMap((unit) => {
    if (!unit.showStart) return [];
    return [unit.type === "group" ? unit.headId : unit.subTask.documentId];
  });
}
