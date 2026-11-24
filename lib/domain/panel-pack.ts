import type { ProductiveWindow } from "@/lib/domain/workday-coverage";

const MS_PER_SECOND = 1000;
const MS_PER_DAY = 86_400_000;
const NEXT_BUSINESS_DAY_LOOKAHEAD = 31;

export type PanelSharingType = "qty" | "duration";

export type PanelSubTaskInput = {
  id: string;
  assigneeIds: readonly string[];
  maxSameTimeWorkers: number;
  sharingType: PanelSharingType;
  expectedTime: number;
  targetQty: number;
  completedQty: number;
  timeSpent: number;
};

export type PanelTaskInput = {
  id: string;
  subTasks: readonly PanelSubTaskInput[];
};

export type PackedPanelTask = {
  id: string;
  days: number;
  usableTodayBySubTask: Record<string, number>;
};

export type PanelPackResult = {
  today: PackedPanelTask[];
  tomorrow: PackedPanelTask[];
  overrunTaskId: string | null;
  ineligibleIds: string[];
};

export function remainingEffortSeconds(input: {
  sharingType: PanelSharingType;
  expectedTime: number;
  targetQty: number;
  completedQty: number;
  timeSpent: number;
}): number {
  if (input.sharingType === "qty") {
    const target = Math.max(1, input.targetQty);
    const remainingPieces = Math.max(0, target - input.completedQty);
    return remainingPieces * (input.expectedTime / target);
  }
  return Math.max(0, input.expectedTime - input.timeSpent);
}

export function isPanelTaskEligible(task: PanelTaskInput): boolean {
  if (task.subTasks.length === 0) return false;
  return task.subTasks.every((subTask) => subTask.assigneeIds.length > 0);
}

function windowsCoverInstant(
  windows: readonly ProductiveWindow[],
  instantMs: number,
): boolean {
  return windows.some(
    (window) => instantMs >= window.startMs && instantMs < window.endMs,
  );
}

export function usableTodaySeconds(input: {
  assigneeWindows: readonly (readonly ProductiveWindow[])[];
  maxSameTimeWorkers: number;
  rangeStartMs: number;
  rangeEndMs: number;
}): number {
  const cap = Math.max(1, Math.floor(input.maxSameTimeWorkers) || 1);
  const startMs = input.rangeStartMs;
  const endMs = input.rangeEndMs;
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return 0;
  }

  const bounds = new Set<number>([startMs, endMs]);
  for (const windows of input.assigneeWindows) {
    for (const window of windows) {
      if (window.endMs <= startMs || window.startMs >= endMs) continue;
      bounds.add(Math.max(startMs, window.startMs));
      bounds.add(Math.min(endMs, window.endMs));
    }
  }
  const points = [...bounds].sort((left, right) => left - right);
  let totalMs = 0;
  for (let index = 0; index < points.length - 1; index += 1) {
    const sliceStart = points[index]!;
    const sliceEnd = points[index + 1]!;
    if (sliceEnd <= sliceStart) continue;
    const mid = (sliceStart + sliceEnd) / 2;
    let covering = 0;
    for (const windows of input.assigneeWindows) {
      if (windowsCoverInstant(windows, mid)) covering += 1;
    }
    const workers = Math.min(covering, cap);
    if (workers > 0) totalMs += (sliceEnd - sliceStart) * workers;
  }
  return Math.floor(totalMs / MS_PER_SECOND);
}

function windowsForAssignees(
  assigneeIds: readonly string[],
  laborByAssigneeId: ReadonlyMap<string, readonly ProductiveWindow[]>,
): (readonly ProductiveWindow[])[] {
  return assigneeIds.map((assigneeId) => laborByAssigneeId.get(assigneeId) ?? []);
}

export function crewDaysForTask(
  task: PanelTaskInput,
  laborByAssigneeId: ReadonlyMap<string, readonly ProductiveWindow[]>,
  rangeStartMs: number,
  rangeEndMs: number,
): { days: number; usableTodayBySubTask: Record<string, number> } {
  const usableTodayBySubTask: Record<string, number> = {};
  let days = 0;
  for (const subTask of task.subTasks) {
    const remaining = remainingEffortSeconds(subTask);
    const usable = usableTodaySeconds({
      assigneeWindows: windowsForAssignees(subTask.assigneeIds, laborByAssigneeId),
      maxSameTimeWorkers: subTask.maxSameTimeWorkers,
      rangeStartMs,
      rangeEndMs,
    });
    usableTodayBySubTask[subTask.id] = usable;
    if (remaining <= 0) continue;
    if (usable <= 0) {
      return { days: Number.POSITIVE_INFINITY, usableTodayBySubTask };
    }
    days += remaining / usable;
  }
  return { days, usableTodayBySubTask };
}

export function packPanelTasks(
  tasks: readonly PanelTaskInput[],
  laborByAssigneeId: ReadonlyMap<string, readonly ProductiveWindow[]>,
  rangeStartMs: number,
  rangeEndMs: number,
): PanelPackResult {
  const today: PackedPanelTask[] = [];
  const tomorrow: PackedPanelTask[] = [];
  const ineligibleIds: string[] = [];
  let overrunTaskId: string | null = null;
  let overflowStarted = false;

  for (const task of tasks) {
    if (!isPanelTaskEligible(task)) {
      ineligibleIds.push(task.id);
      continue;
    }
    const packed = crewDaysForTask(
      task,
      laborByAssigneeId,
      rangeStartMs,
      rangeEndMs,
    );
    const item: PackedPanelTask = {
      id: task.id,
      days: packed.days,
      usableTodayBySubTask: packed.usableTodayBySubTask,
    };
    if (!overflowStarted && packed.days <= 1) {
      today.push(item);
      continue;
    }
    if (!overflowStarted && packed.days > 1) {
      today.push(item);
      overrunTaskId = task.id;
      overflowStarted = true;
      continue;
    }
    tomorrow.push(item);
  }

  return { today, tomorrow, overrunTaskId, ineligibleIds };
}

function addIsoDays(isoDate: string, days: number): string {
  const utc = Date.parse(`${isoDate}T00:00:00.000Z`);
  if (!Number.isFinite(utc)) return isoDate;
  return new Date(utc + days * MS_PER_DAY).toISOString().slice(0, 10);
}

export function findNextBusinessDate(
  fromIsoExclusive: string,
  hasLabor: (isoDate: string) => boolean,
  lookaheadDays = NEXT_BUSINESS_DAY_LOOKAHEAD,
): string | null {
  for (let offset = 1; offset <= lookaheadDays; offset += 1) {
    const isoDate = addIsoDays(fromIsoExclusive, offset);
    if (hasLabor(isoDate)) return isoDate;
  }
  return null;
}
