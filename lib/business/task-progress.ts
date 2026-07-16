import { elapsedSecondsSince } from "@/lib/format/datetime";

const FULL_PROGRESS_PERCENT = 100;
const FINISHED_STATUS = "finished";
const DISABLED_ACTIVATION = "disabled";

export type KanbanProgressStatus =
  | "waiting"
  | "producing"
  | "paused"
  | "finished";

export type TaskProgressSubTaskInput = {
  status: KanbanProgressStatus | string;
  expectedTime: number;
  timeSpent: number;
  /** When omitted, the sub-task is treated as counted (not disabled). */
  activationStatus?: string | null;
};

export type ActivitySessionRef = {
  subTaskDocumentId: string;
  colaboratorDocumentId: string;
  action: "started" | "stoped";
  timestamp: string;
};

export type BoardTaskProgressInput = {
  /** Unfinished, counted sub-tasks only (loader filters). */
  subTasks: TaskProgressSubTaskInput[];
  openActivityStartedAts: string[];
};

export function shouldShowKanbanTaskProgress(
  status: KanbanProgressStatus,
): boolean {
  return status === "producing" || status === "paused";
}

export function isOverExpected(
  spentSec: number,
  expectedSec: number,
): boolean {
  return expectedSec > 0 && spentSec > expectedSec;
}

export function isCountedForTaskProgress(
  subTask: Pick<TaskProgressSubTaskInput, "activationStatus">,
): boolean {
  return subTask.activationStatus !== DISABLED_ACTIVATION;
}

export function isUnfinishedForTaskProgress(
  subTask: Pick<TaskProgressSubTaskInput, "status">,
): boolean {
  return subTask.status !== FINISHED_STATUS;
}

/** Live elapsed seconds across open kiosk sessions. */
export function resolveOpenSessionsElapsedSeconds(
  openActivityStartedAts: readonly string[],
  nowMs: number,
): number {
  let total = 0;
  for (const startedAt of openActivityStartedAts) {
    total += elapsedSecondsSince(startedAt, nowMs);
  }
  return total;
}

/**
 * Remaining work budget (seconds), using already-scaled sub-task expectedTime.
 *
 * For each unfinished counted sub-task: expectedTime − timeSpent.
 * Then subtract live open sessions (person-seconds, same unit as timeSpent).
 *
 * Matches task.totalExpectedTime semantics (disabled excluded; expected already
 * includes task.qty scaling at SubTask create).
 */
export function resolveTaskRemainingSeconds(
  subTasks: readonly TaskProgressSubTaskInput[],
  openActivityStartedAts: readonly string[],
  nowMs: number,
): number {
  let remaining = 0;

  for (const subTask of subTasks) {
    if (!isCountedForTaskProgress(subTask)) continue;
    if (!isUnfinishedForTaskProgress(subTask)) continue;
    remaining += Math.max(0, subTask.expectedTime) - Math.max(0, subTask.timeSpent);
  }

  remaining -= resolveOpenSessionsElapsedSeconds(openActivityStartedAts, nowMs);
  return remaining;
}

/**
 * Open session starts: latest action per (subTask, colaborator) is "started".
 * Same pairing model as kiosk/session activity tracking.
 */
export function listOpenActivityStartedAts(
  activities: readonly ActivitySessionRef[],
): string[] {
  const sorted = [...activities].sort((left, right) =>
    left.timestamp.localeCompare(right.timestamp),
  );
  const openBySession = new Map<string, string>();

  for (const activity of sorted) {
    const key = `${activity.subTaskDocumentId}:${activity.colaboratorDocumentId}`;
    if (activity.action === "started") {
      openBySession.set(key, activity.timestamp);
      continue;
    }
    openBySession.delete(key);
  }

  return [...openBySession.values()];
}

export function resolveProgressScaleSeconds(
  expectedSec: number,
  spentSec: number,
): number {
  return Math.max(expectedSec, spentSec, 0);
}

export function resolveProgressMarkPercent(
  expectedSec: number,
  spentSec: number,
): number {
  const scale = resolveProgressScaleSeconds(expectedSec, spentSec);
  if (scale <= 0) return FULL_PROGRESS_PERCENT;
  return Math.min(
    FULL_PROGRESS_PERCENT,
    (Math.max(0, expectedSec) / scale) * FULL_PROGRESS_PERCENT,
  );
}

export function resolveProgressFillPercent(
  expectedSec: number,
  spentSec: number,
): number {
  const scale = resolveProgressScaleSeconds(expectedSec, spentSec);
  if (scale <= 0) return 0;
  return Math.min(
    FULL_PROGRESS_PERCENT,
    (Math.max(0, spentSec) / scale) * FULL_PROGRESS_PERCENT,
  );
}
