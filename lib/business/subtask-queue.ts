export type SubTaskStatus = "waiting" | "producing" | "paused" | "finished";

export type ActivationStatus = "locked" | "unlocked" | "disabled";

const DEFAULT_ACTIVATION_STATUS: ActivationStatus = "locked";

export interface QueuedSubTask {
  documentId: string;
  name: string;
  index: number;
  status: SubTaskStatus;
  activationStatus?: ActivationStatus;
}

export interface KioskSubTask extends QueuedSubTask {
  qty: number;
  completedQty: number;
  sharingType: "qty" | "duration";
  timeSpent: number;
  startedAt: string | null;
}

/** Remaining pieces any colaborator may report on exit (global sum). */
export function getRemainingSubTaskQty(
  qty: number,
  completedQty: number,
): number {
  return Math.max(0, qty - completedQty);
}

/** Sort subtasks by index ascending. */
export function sortSubTasksByIndex<T extends { index: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.index - b.index);
}

/** Whether a subtask is currently in progress. */
export function hasActiveSubTask(subTasks: QueuedSubTask[]): boolean {
  return subTasks.some((st) => st.status === "producing");
}

export function resolveActivationStatus(
  status: ActivationStatus | undefined,
): ActivationStatus {
  return status ?? DEFAULT_ACTIVATION_STATUS;
}

export function isUnlockedSubTask(subTask: QueuedSubTask): boolean {
  return resolveActivationStatus(subTask.activationStatus) === "unlocked";
}

/** Whether the subtask is blocked by dependencies and shown as locked on kiosk. */
export function isLockedSubTask(subTask: QueuedSubTask): boolean {
  if (isFinishedSubTask(subTask)) return false;
  return resolveActivationStatus(subTask.activationStatus) === "locked";
}

/** Next unlocked queued subtask when none is active. */
export function nextStartableSubTask(
  subTasks: QueuedSubTask[],
): QueuedSubTask | null {
  if (hasActiveSubTask(subTasks)) return null;
  const sorted = sortSubTasksByIndex(subTasks);
  return (
    sorted.find((st) => st.status === "waiting" && isUnlockedSubTask(st)) ?? null
  );
}

/** Whether the given subtask can be started now. */
export function canStartSubTask(
  subTasks: QueuedSubTask[],
  documentId: string,
): boolean {
  if (hasActiveSubTask(subTasks)) return false;
  const subTask = subTasks.find((st) => st.documentId === documentId);
  if (!subTask || subTask.status !== "waiting") return false;
  return isUnlockedSubTask(subTask);
}

/** Whether the given subtask can be stopped (must be producing). */
export function canStopSubTask(subTask: QueuedSubTask): boolean {
  return subTask.status === "producing";
}

/** Whether the subtask is finished and read-only on the kiosk. */
export function isFinishedSubTask(subTask: QueuedSubTask): boolean {
  return subTask.status === "finished";
}
