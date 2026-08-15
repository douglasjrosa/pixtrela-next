import {
  countActiveWorkersFromActivities,
} from "@/lib/business/subtask-active-workers";
import type { TaskStatus } from "@/lib/business/task-completion";
import {
  resolveTaskStatusFromSubTasks,
  shouldKeepCompletedTaskStatus,
} from "@/lib/business/task-completion";
import {
  resolveSubTaskActivationStatusUpdates,
  type SubTaskActivationSyncRow,
} from "@/lib/business/subtask-activation-sync";
import { shouldSetTaskStartedAt } from "@/lib/business/task-started-at";
import {
  calculateTaskTotalTimeSpent,
  type ActivityTimeRow,
  type SubTaskTimeSpentInput,
} from "@/lib/business/task-time-spent";
import {
  fromDrizzleActivationStatus,
  toDrizzleActivationStatus,
} from "@/lib/domain/subtask-activation-map";

const FINISHED_STATUS = "finished";

export type ParentTaskSyncInput = {
  currentStatus: string;
  currentStartedAt: Date | null;
  currentEndedAt: Date | null;
  siblings: Array<{
    status: string;
    activationStatus?: string | null;
  }>;
};

export type ParentTaskSyncResult = {
  status: TaskStatus;
  startedAt: Date | null;
  endedAt: Date | null;
  changed: boolean;
} | null;

export function resolveParentTaskSyncUpdate(
  input: ParentTaskSyncInput,
  now: Date,
): ParentTaskSyncResult {
  const nextStatus = resolveTaskStatusFromSubTasks(input.siblings);
  const currentStatus = String(input.currentStatus ?? "");

  if (shouldKeepCompletedTaskStatus(currentStatus, nextStatus)) {
    return null;
  }

  if (
    nextStatus === currentStatus &&
    !shouldSetTaskStartedAt(nextStatus, input.currentStartedAt)
  ) {
    return null;
  }

  if (nextStatus === FINISHED_STATUS) {
    return {
      status: FINISHED_STATUS,
      startedAt: input.currentStartedAt,
      endedAt: now,
      changed: true,
    };
  }

  const startedAt = shouldSetTaskStartedAt(nextStatus, input.currentStartedAt)
    ? now
    : input.currentStartedAt;

  return {
    status: nextStatus,
    startedAt,
    endedAt: null,
    changed: true,
  };
}

export function buildActivationSyncRows(
  siblings: Array<{
    id: string;
    status: string;
    activationStatus: string;
    maxSameTimeWorkers: number;
    dependencyIds: string[];
  }>,
  activitiesBySubTaskId: Map<string, ActivityTimeRow[]>,
): SubTaskActivationSyncRow[] {
  return siblings.map((row) => ({
    documentId: row.id,
    status: row.status,
    activationStatus: fromDrizzleActivationStatus(row.activationStatus),
    dependencies: row.dependencyIds,
    maxSameTimeWorkers: row.maxSameTimeWorkers,
    activeWorkerCount: countActiveWorkersFromActivities(
      activitiesBySubTaskId.get(row.id) ?? [],
    ),
  }));
}

export function buildSubTaskTimeSpentInputs(
  siblings: Array<{
    id: string;
    status: string;
    timeSpent: number;
  }>,
  activitiesBySubTaskId: Map<string, ActivityTimeRow[]>,
): SubTaskTimeSpentInput[] {
  return siblings.map((row) => ({
    timeSpent: row.timeSpent,
    status: row.status,
    activities: activitiesBySubTaskId.get(row.id) ?? [],
  }));
}

export function activationUpdateToDrizzle(
  status: "locked" | "unlocked",
): "inactive" | "active" {
  return toDrizzleActivationStatus(status) as "inactive" | "active";
}

export { FINISHED_STATUS };
