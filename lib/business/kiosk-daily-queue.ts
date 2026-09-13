import {
  DEFAULT_TIME_ZONE,
  isSameCalendarDay,
} from "@/lib/business/datetime-timezone";

const FINISHED_STATUS = "finished";

export type KioskQueueRow = {
  documentId: string;
  name: string;
  index: number;
  status: string;
  activationStatus: string;
  taskIndex: number;
  finishedAt: string | null;
  viewerParticipated?: boolean;
};

export function isVisibleInKioskDailyQueue(
  subTask: { status: string; viewerParticipated?: boolean },
  finishedAt: Date | string | null,
  now: Date,
  timeZone = DEFAULT_TIME_ZONE,
): boolean {
  if (subTask.status !== FINISHED_STATUS) return true;
  if (!finishedAt) return false;
  if (subTask.viewerParticipated !== true) return false;

  const finishedDate =
    finishedAt instanceof Date ? finishedAt : new Date(finishedAt);
  if (Number.isNaN(finishedDate.getTime())) return false;

  return isSameCalendarDay(finishedDate, now, timeZone);
}

export function filterKioskDailyQueue<T extends KioskQueueRow>(
  rows: T[],
  now: Date,
  timeZone = DEFAULT_TIME_ZONE,
): T[] {
  return rows.filter((row) =>
    isVisibleInKioskDailyQueue(
      row,
      row.finishedAt ? new Date(row.finishedAt) : null,
      now,
      timeZone,
    ),
  );
}

/**
 * Stable kiosk queue order by board position only. Runtime state (producing,
 * waiting, paused) is handled when splitting UI sections — not here.
 */
export function sortKioskDailyQueue<T extends KioskQueueRow>(rows: T[]): T[] {
  return [...rows].sort((left, right) => {
    const taskDiff = left.taskIndex - right.taskIndex;
    if (taskDiff !== 0) return taskDiff;

    return left.index - right.index;
  });
}
