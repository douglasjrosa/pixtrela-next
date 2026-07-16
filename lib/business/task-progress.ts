import { elapsedSecondsSince } from "@/lib/format/datetime";

const FULL_PROGRESS_PERCENT = 100;
const FINISHED_STATUS = "finished";
const WAITING_STATUS = "waiting";
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
  qty?: number;
  colaboratorName?: string;
};

export type BoardTaskProgressInput = {
  /** Unfinished, counted sub-tasks only (loader filters). */
  subTasks: TaskProgressSubTaskInput[];
  openActivityStartedAts: string[];
};

export type ActivitySession = {
  colaboratorDocumentId: string;
  colaboratorName: string;
  startedAt: string;
  finishedAt: string;
  durationSec: number;
  qty: number;
};

export type SessionColaboratorTotal = {
  colaboratorDocumentId: string;
  colaboratorName: string;
  totalDurationSec: number;
  totalQty: number;
};

export type SharingType = "qty" | "duration";

export function shouldShowKanbanTaskProgress(
  status: KanbanProgressStatus,
): boolean {
  return status !== WAITING_STATUS;
}

/** Live opens / sub-task fetch only for in-progress board tasks. */
export function needsLiveBoardProgress(
  status: KanbanProgressStatus,
): boolean {
  return status === "producing" || status === "paused";
}

export function shouldShowSubTaskProgress(
  status: KanbanProgressStatus | string,
): boolean {
  return status !== WAITING_STATUS;
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

/** Live elapsed seconds across open kiosk sessions (person-seconds). */
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
 * Persisted spent plus live open sessions (person-seconds).
 * With n parallel workers, each wall-clock second adds n person-seconds.
 */
export function resolveLiveTimeSpent(
  persistedSpentSec: number,
  openActivityStartedAts: readonly string[],
  nowMs: number,
): number {
  return (
    Math.max(0, persistedSpentSec) +
    resolveOpenSessionsElapsedSeconds(openActivityStartedAts, nowMs)
  );
}

/**
 * Remaining work budget (seconds), using already-scaled sub-task expectedTime.
 *
 * For each unfinished counted sub-task: expectedTime − timeSpent.
 * Then subtract live open sessions (person-seconds, same unit as timeSpent).
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

/** Remaining for a finished task from persisted totals only (no live opens). */
export function resolvePersistedRemainingSeconds(
  expectedSec: number,
  spentSec: number,
): number {
  return Math.max(0, expectedSec) - Math.max(0, spentSec);
}

/**
 * Remaining for a single sub-task (same person-seconds model as the task bar).
 */
export function resolveSubTaskRemainingSeconds(
  expectedSec: number,
  persistedSpentSec: number,
  openActivityStartedAts: readonly string[],
  nowMs: number,
): number {
  return (
    Math.max(0, expectedSec) -
    resolveLiveTimeSpent(persistedSpentSec, openActivityStartedAts, nowMs)
  );
}

/**
 * Open session starts: latest action per (subTask, colaborator) is "started".
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

type OpenSessionDraft = {
  startedAt: string;
  colaboratorDocumentId: string;
  colaboratorName: string;
};

/**
 * Closed sessions from started→stoped pairs (chronological per colaborator).
 * Open sessions (no stop yet) are omitted.
 */
export function listActivitySessions(
  activities: readonly ActivitySessionRef[],
): ActivitySession[] {
  const sorted = [...activities].sort((left, right) =>
    left.timestamp.localeCompare(right.timestamp),
  );
  const openByKey = new Map<string, OpenSessionDraft>();
  const sessions: ActivitySession[] = [];

  for (const activity of sorted) {
    const key = `${activity.subTaskDocumentId}:${activity.colaboratorDocumentId}`;
    const name = activity.colaboratorName ?? "";

    if (activity.action === "started") {
      openByKey.set(key, {
        startedAt: activity.timestamp,
        colaboratorDocumentId: activity.colaboratorDocumentId,
        colaboratorName: name,
      });
      continue;
    }

    const open = openByKey.get(key);
    if (!open) continue;
    openByKey.delete(key);

    const startMs = Date.parse(open.startedAt);
    const endMs = Date.parse(activity.timestamp);
    const durationSec =
      Number.isFinite(startMs) && Number.isFinite(endMs)
        ? Math.max(0, Math.floor((endMs - startMs) / 1000))
        : 0;

    sessions.push({
      colaboratorDocumentId: open.colaboratorDocumentId,
      colaboratorName: open.colaboratorName || name,
      startedAt: open.startedAt,
      finishedAt: activity.timestamp,
      durationSec,
      qty: Math.max(0, Number(activity.qty ?? 0)),
    });
  }

  return sessions;
}

export function aggregateSessionTotals(
  sessions: readonly ActivitySession[],
): SessionColaboratorTotal[] {
  const byColaborator = new Map<string, SessionColaboratorTotal>();

  for (const session of sessions) {
    const existing = byColaborator.get(session.colaboratorDocumentId);
    if (!existing) {
      byColaborator.set(session.colaboratorDocumentId, {
        colaboratorDocumentId: session.colaboratorDocumentId,
        colaboratorName: session.colaboratorName,
        totalDurationSec: session.durationSec,
        totalQty: session.qty,
      });
      continue;
    }
    existing.totalDurationSec += session.durationSec;
    existing.totalQty += session.qty;
    if (!existing.colaboratorName && session.colaboratorName) {
      existing.colaboratorName = session.colaboratorName;
    }
  }

  return [...byColaborator.values()];
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

/** @deprecated Prefer resolveProgressOkFillPercent + resolveProgressOverFillPercent. */
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

/** Green segment: portion of spent that is within expected, as % of scale. */
export function resolveProgressOkFillPercent(
  expectedSec: number,
  spentSec: number,
): number {
  const scale = resolveProgressScaleSeconds(expectedSec, spentSec);
  if (scale <= 0) return 0;
  const okSpent = Math.min(Math.max(0, spentSec), Math.max(0, expectedSec));
  return Math.min(FULL_PROGRESS_PERCENT, (okSpent / scale) * FULL_PROGRESS_PERCENT);
}

/** Red segment: portion of spent that exceeds expected, as % of scale. */
export function resolveProgressOverFillPercent(
  expectedSec: number,
  spentSec: number,
): number {
  const scale = resolveProgressScaleSeconds(expectedSec, spentSec);
  if (scale <= 0) return 0;
  const overSpent = Math.max(0, Math.max(0, spentSec) - Math.max(0, expectedSec));
  return Math.min(
    FULL_PROGRESS_PERCENT,
    (overSpent / scale) * FULL_PROGRESS_PERCENT,
  );
}
