export type SubTaskStatus = "waiting" | "producing" | "paused" | "finished";

export type ActivationStatus = "locked" | "unlocked" | "disabled";

export type MaterialFlagOption = {
  id: string;
  code: string;
};

export type DependencyFlagHint = {
  predecessorId?: string;
  predecessorName: string;
  codes: string[];
  flags?: Array<{ id: string; code: string }>;
  semBandeira?: boolean;
};

const DEFAULT_ACTIVATION_STATUS: ActivationStatus = "locked";

export interface QueuedSubTask {
  documentId: string;
  name: string;
  index: number;
  status: SubTaskStatus;
  activationStatus?: ActivationStatus;
  /** Open session for the current kiosk viewer, if any. */
  startedAt?: string | null;
  activeWorkerCount?: number;
}

export interface KioskSubTask extends QueuedSubTask {
  qty: number;
  /** Pieces required for the whole task (subTask.qty * task.qty). */
  targetQty: number;
  completedQty: number;
  sharingType: "qty" | "duration";
  timeSpent: number;
  startedAt: string | null;
  expectedTime: number;
  taskDocumentId: string;
  taskName: string;
  taskIndex: number;
  finishedAt: string | null;
  /** True when the kiosk viewer has a stop session on this subtask. */
  viewerParticipated?: boolean;
  /** Currency credited to the viewer from their stop activities. */
  viewerCurrencyAwarded?: number;
  activeWorkerCount: number;
  linkedToPrevious?: boolean;
  maxSameTimeWorkers?: number;
  assignedToIds?: string[];
  dependencyIds?: string[];
  subTaskCategoryId?: string | null;
  assignedFlagCodes?: string[];
  availableFlags?: MaterialFlagOption[];
  dependencyFlags?: DependencyFlagHint[];
  /** Producer sub-tasks must assign material flags before finishing. */
  requiresMaterialFlagsOnFinish?: boolean;
}

export interface KioskQueueSections {
  producing: KioskSubTask[];
  pending: KioskSubTask[];
  finishedToday: KioskSubTask[];
}

/** Remaining pieces any colaborator may report on exit (global sum). */
export function getRemainingSubTaskQty(
  targetQty: number,
  completedQty: number,
): number {
  return Math.max(0, targetQty - completedQty);
}

/** Whether a qty-sharing subtask can still accept reported pieces. */
export function hasRemainingReportableQty(
  subTask: QueuedSubTask & {
    sharingType?: "qty" | "duration";
    targetQty?: number;
    completedQty?: number;
  },
): boolean {
  if (subTask.sharingType !== "qty") return true;
  const target = subTask.targetQty ?? 1;
  const completed = subTask.completedQty ?? 0;
  return getRemainingSubTaskQty(target, completed) > 0;
}

/** Sort subtasks by index ascending. */
export function sortSubTasksByIndex<T extends { index: number }>(
  items: readonly T[],
): T[] {
  return [...items].sort((a, b) => a.index - b.index);
}

export function splitKioskQueueSections(
  subTasks: readonly KioskSubTask[],
): KioskQueueSections {
  return {
    producing: subTasks.filter((subTask) => subTask.status === "producing"),
    pending: subTasks.filter(
      (subTask) =>
        subTask.status !== "producing" && subTask.status !== "finished",
    ),
    finishedToday: subTasks.filter((subTask) => subTask.status === "finished"),
  };
}

/** Whether the current viewer has an open session on this subtask. */
export function hasViewerSession(subTask: QueuedSubTask): boolean {
  return Boolean(subTask.startedAt);
}

/** Whether the viewer has any open session in the queue. */
export function hasActiveSubTask(subTasks: readonly QueuedSubTask[]): boolean {
  return subTasks.some((st) => hasViewerSession(st));
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
  if (subTask.status === "producing" || hasViewerSession(subTask)) return false;
  return resolveActivationStatus(subTask.activationStatus) === "locked";
}

/** Next unlocked queued subtask when none is active for the viewer. */
export function nextStartableSubTask(
  subTasks: readonly QueuedSubTask[],
): QueuedSubTask | null {
  if (hasActiveSubTask(subTasks)) return null;
  const sorted = sortSubTasksByIndex(subTasks);
  return (
    sorted.find((st) => {
      if (isFinishedSubTask(st) || hasViewerSession(st)) return false;
      if (st.status === "waiting" || st.status === "paused") {
        return isUnlockedSubTask(st);
      }
      return st.status === "producing";
    }) ?? null
  );
}

/** Whether the given subtask can be started now by the viewer. */
export function canStartSubTask(
  subTasks: readonly QueuedSubTask[],
  documentId: string,
): boolean {
  if (hasActiveSubTask(subTasks)) return false;
  const subTask = subTasks.find((st) => st.documentId === documentId);
  if (!subTask || hasViewerSession(subTask)) return false;
  if (isFinishedSubTask(subTask)) return false;
  if (!hasRemainingReportableQty(subTask)) return false;
  if (resolveActivationStatus(subTask.activationStatus) === "disabled") {
    return false;
  }
  if (subTask.status === "waiting" || subTask.status === "paused") {
    return isUnlockedSubTask(subTask);
  }
  // Join an in-progress multi-worker subtask still shown in the queue.
  return subTask.status === "producing";
}

/** Whether the viewer can stop this subtask (own open session). */
export function canStopSubTask(subTask: QueuedSubTask): boolean {
  return hasViewerSession(subTask);
}

/** Whether the subtask is finished and read-only on the kiosk. */
export function isFinishedSubTask(subTask: QueuedSubTask): boolean {
  return subTask.status === "finished";
}

/**
 * When the viewer is the only active worker, they may mark the subtask finished.
 */
export function canCompleteSubTaskOnExit(subTask: QueuedSubTask): boolean {
  if (!hasViewerSession(subTask)) return false;
  const activeCount = subTask.activeWorkerCount ?? 1;
  return activeCount <= 1;
}

/** Whether the start button should render for this subtask card. */
export function shouldShowStartButton(
  subTasks: readonly QueuedSubTask[],
  subTask: QueuedSubTask,
): boolean {
  return canStartSubTask(subTasks, subTask.documentId);
}

/** Whether the exit button should render for this subtask card. */
export function shouldShowExitButton(
  subTasks: readonly QueuedSubTask[],
  subTask: QueuedSubTask,
): boolean {
  return canStopSubTask(subTask);
}

/** Formats remaining worker names for the exit toast (pt-BR). */
export function formatRemainingWorkerNames(names: string[]): string {
  const cleaned = names.map((name) => name.trim()).filter(Boolean);
  if (cleaned.length === 0) return "";
  if (cleaned.length === 1) return cleaned[0]!;
  if (cleaned.length === 2) return `${cleaned[0]} e ${cleaned[1]}`;
  const head = cleaned.slice(0, -1).join(", ");
  return `${head} e ${cleaned[cleaned.length - 1]}`;
}
