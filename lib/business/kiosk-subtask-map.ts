import { resolveSubTaskTargetQty } from "@/lib/domain/work-currency";

const DISABLED_ACTIVATION_STATUS = "disabled";

export type KioskSubTaskRow = {
  documentId: string;
  name: string;
  index: number;
  status: string;
  activationStatus: "locked" | "unlocked" | "disabled";
  qty: number;
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
  activeWorkerCount: number;
  linkedToPrevious?: boolean;
  maxSameTimeWorkers?: number;
  assignedToIds?: string[];
  dependencyIds?: string[];
};

export type SubTaskDbRow = {
  id: string;
  name: string;
  index: number;
  status: string;
  activationStatus: string;
  qty: number;
  sharingType: string;
  timeSpent: number;
  expectedTime: number;
  taskId: string;
  taskName: string;
  taskIndex: number;
  taskQty: number;
  maxSameTimeWorkers: number;
  linkedToPrevious: boolean;
};

export type SessionActivityRef = {
  subTaskId: string;
  action: "started" | "stoped";
  timestamp: string;
};

function readActivationStatus(
  value: string | null | undefined,
): KioskSubTaskRow["activationStatus"] {
  if (value === "unlocked" || value === "active") return "unlocked";
  if (value === "disabled" || value === "blocked") return "disabled";
  return "locked";
}

export function isVisibleOnKiosk(activationStatus: string | undefined): boolean {
  return activationStatus !== DISABLED_ACTIVATION_STATUS;
}

export function mapSubTaskDbRow(
  row: SubTaskDbRow,
  startedAt: string | null = null,
  completedQty = 0,
  finishedAt: string | null = null,
  activeWorkerCount = 0,
): KioskSubTaskRow {
  const sharingType = row.sharingType;
  const qty = Number(row.qty ?? 1);
  return {
    documentId: row.id,
    name: String(row.name ?? ""),
    index: Number(row.index ?? 0),
    status: String(row.status ?? "waiting"),
    activationStatus: readActivationStatus(row.activationStatus),
    qty,
    targetQty: resolveSubTaskTargetQty(qty),
    completedQty: Math.max(0, completedQty),
    sharingType: sharingType === "qty" ? "qty" : "duration",
    timeSpent: Number(row.timeSpent ?? 0),
    startedAt,
    expectedTime: Number(row.expectedTime ?? 0),
    taskDocumentId: String(row.taskId ?? ""),
    taskName: String(row.taskName ?? ""),
    taskIndex: Number(row.taskIndex ?? 0),
    finishedAt,
    activeWorkerCount: Math.max(0, activeWorkerCount),
    linkedToPrevious: row.linkedToPrevious === true,
    maxSameTimeWorkers: Number(row.maxSameTimeWorkers ?? 1),
    assignedToIds: [],
    dependencyIds: [],
  };
}

export function filterKioskVisibleSubTasks<
  T extends { activationStatus?: string },
>(rows: T[]): T[] {
  return rows.filter((row) => isVisibleOnKiosk(row.activationStatus));
}

/**
 * Resolves the open session start timestamp per sub-task for one colaborator.
 * A session is open only when the latest action is "started".
 */
export function buildOpenStartedAtBySubTaskId(
  activityRows: SessionActivityRef[],
): Map<string, string> {
  const sorted = [...activityRows].sort((left, right) =>
    left.timestamp.localeCompare(right.timestamp),
  );
  const openStartBySubTask = new Map<string, string>();

  for (const activity of sorted) {
    if (activity.action === "started") {
      openStartBySubTask.set(activity.subTaskId, activity.timestamp);
      continue;
    }
    openStartBySubTask.delete(activity.subTaskId);
  }

  return openStartBySubTask;
}

export function buildFinishedAtBySubTaskId(
  activityRows: Array<{ subTaskId: string; timestamp: string }>,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const activity of activityRows) {
    const current = map.get(activity.subTaskId);
    if (!current || activity.timestamp > current) {
      map.set(activity.subTaskId, activity.timestamp);
    }
  }
  return map;
}

export function sumStoppedQtyBySubTaskId(
  activityRows: Array<{
    subTaskId: string;
    action: string;
    qty: number;
  }>,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const activity of activityRows) {
    if (activity.action !== "stoped") continue;
    const current = map.get(activity.subTaskId) ?? 0;
    map.set(activity.subTaskId, current + Math.max(0, activity.qty));
  }
  return map;
}

export type ViewerStopActivityRef = {
  subTaskId: string;
  action: string;
  currencyAwarded?: number;
};

/** Viewer earned currency and participation from their own stop activities. */
export function buildViewerStopStatsBySubTaskId(
  activityRows: readonly ViewerStopActivityRef[],
): {
  participatedIds: Set<string>;
  currencyBySubTaskId: Map<string, number>;
} {
  const participatedIds = new Set<string>();
  const currencyBySubTaskId = new Map<string, number>();
  for (const activity of activityRows) {
    if (activity.action !== "stoped") continue;
    participatedIds.add(activity.subTaskId);
    const awarded = Math.max(0, Number(activity.currencyAwarded ?? 0));
    const current = currencyBySubTaskId.get(activity.subTaskId) ?? 0;
    currencyBySubTaskId.set(activity.subTaskId, current + awarded);
  }
  return { participatedIds, currencyBySubTaskId };
}
