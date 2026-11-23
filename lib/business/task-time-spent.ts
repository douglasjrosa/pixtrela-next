import { calculateActivityDurationSeconds } from "@/lib/business/activity-duration";
import type { SessionSecondsMeasurer } from "@/lib/domain/workday-coverage";

const PRODUCING_STATUS = "producing";

export type ActivityTimeRow = {
  action: "started" | "stoped";
  timestamp: Date;
  colaboratorId: string;
};

export type SubTaskTimeSpentInput = {
  timeSpent: number;
  status: string;
  activities: ActivityTimeRow[];
};

function sortByTimestamp(rows: ActivityTimeRow[]): ActivityTimeRow[] {
  return [...rows].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

function groupByColaborator(
  rows: ActivityTimeRow[],
): Map<string, ActivityTimeRow[]> {
  const map = new Map<string, ActivityTimeRow[]>();
  for (const row of rows) {
    const list = map.get(row.colaboratorId) ?? [];
    list.push(row);
    map.set(row.colaboratorId, list);
  }
  return map;
}

function sessionSeconds(
  startedAt: Date,
  endedAt: Date,
  colaboratorId: string,
  measure?: SessionSecondsMeasurer,
): number {
  if (measure) return measure(startedAt, endedAt, colaboratorId);
  return calculateActivityDurationSeconds(startedAt, endedAt);
}

function sumColaboratorSessionSeconds(
  rows: ActivityTimeRow[],
  now: Date,
  colaboratorId: string,
  measure?: SessionSecondsMeasurer,
): number {
  const sorted = sortByTimestamp(rows);
  let openStart: Date | null = null;
  let total = 0;

  for (const activity of sorted) {
    if (activity.action === "started") {
      openStart = activity.timestamp;
      continue;
    }

    if (activity.action === "stoped" && openStart) {
      total += sessionSeconds(
        openStart,
        activity.timestamp,
        colaboratorId,
        measure,
      );
      openStart = null;
    }
  }

  if (openStart) {
    total += sessionSeconds(openStart, now, colaboratorId, measure);
  }

  return total;
}

export function calculateTimeSpentFromActivities(
  activities: ActivityTimeRow[],
  now: Date,
  measure?: SessionSecondsMeasurer,
): number {
  const byColaborator = groupByColaborator(activities);
  let total = 0;

  for (const [colaboratorId, colaboratorActivities] of byColaborator) {
    total += sumColaboratorSessionSeconds(
      colaboratorActivities,
      now,
      colaboratorId,
      measure,
    );
  }

  return total;
}

export function listTimeSpentByColaborator(
  activities: ActivityTimeRow[],
  now: Date,
  measure?: SessionSecondsMeasurer,
): Array<{ colaboratorId: string; timeSpentSeconds: number }> {
  const byColaborator = groupByColaborator(activities);
  const result: Array<{ colaboratorId: string; timeSpentSeconds: number }> = [];

  for (const [colaboratorId, rows] of byColaborator.entries()) {
    const timeSpentSeconds = sumColaboratorSessionSeconds(
      rows,
      now,
      colaboratorId,
      measure,
    );
    if (timeSpentSeconds > 0) {
      result.push({ colaboratorId, timeSpentSeconds });
    }
  }

  return result;
}

export function calculateSubTaskLiveTimeSpent(
  input: SubTaskTimeSpentInput,
  now: Date,
  measure?: SessionSecondsMeasurer,
): number {
  if (input.status === PRODUCING_STATUS) {
    return calculateTimeSpentFromActivities(input.activities, now, measure);
  }
  return Math.max(0, input.timeSpent);
}

export function calculateTaskTotalTimeSpent(
  subTaskInputs: SubTaskTimeSpentInput[],
  now: Date,
  measure?: SessionSecondsMeasurer,
): number {
  return subTaskInputs.reduce(
    (total, subTask) =>
      total + calculateSubTaskLiveTimeSpent(subTask, now, measure),
    0,
  );
}
