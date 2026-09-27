import { allocateChainTimeline } from "@/lib/business/subtask-chain-allocation";

const MS_PER_SECOND = 1000;
const MIN_SAME_TIME_WORKERS = 1;

export type GroupPresence = {
  userId: string;
  joinedAt: Date;
  leftAt: Date | null;
};

export type GroupCloseActivity = {
  subTaskId: string;
  colaboratorId: string;
  startedAt: Date;
  stoppedAt: Date;
  timeSpentSeconds: number;
};

export function groupCapacity(maxSameTimeWorkers: readonly number[]): number {
  return maxSameTimeWorkers.reduce(
    (max, value) => Math.max(max, value),
    MIN_SAME_TIME_WORKERS,
  );
}

function overlapSeconds(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): number {
  const start = Math.max(startA.getTime(), startB.getTime());
  const end = Math.min(endA.getTime(), endB.getTime());
  if (end <= start) return 0;
  return Math.floor((end - start) / MS_PER_SECOND);
}

function splitByWeights(total: number, weights: readonly number[]): number[] {
  const sum = weights.reduce((totalWeight, value) => totalWeight + value, 0);
  if (weights.length === 0 || sum <= 0 || total <= 0) {
    return weights.map(() => 0);
  }
  const parts = weights.map((weight) => Math.floor((total * weight) / sum));
  const assigned = parts.reduce((totalAssigned, value) => totalAssigned + value, 0);
  const lastIndex = parts.length - 1;
  parts[lastIndex] = (parts[lastIndex] ?? 0) + (total - assigned);
  return parts;
}

/**
 * Splits the real group wall clock across members by expectedTime, then
 * splits each segment across workers by how long they were present.
 */
export function planGroupCloseActivities(input: {
  runStartedAt: Date;
  endedAt: Date;
  members: readonly { documentId: string; expectedTime: number }[];
  presences: readonly GroupPresence[];
}): GroupCloseActivity[] {
  const timeline = allocateChainTimeline({
    runStartedAt: input.runStartedAt,
    stopAt: input.endedAt,
    finishedThisRun: input.members,
  });
  const planned: GroupCloseActivity[] = [];

  for (const segment of timeline.segments) {
    const overlaps = input.presences.map((presence) =>
      overlapSeconds(
        segment.startedAt,
        segment.stoppedAt,
        presence.joinedAt,
        presence.leftAt ?? input.endedAt,
      ),
    );
    const shares = splitByWeights(segment.timeSpent, overlaps);
    input.presences.forEach((presence, index) => {
      const timeSpentSeconds = shares[index] ?? 0;
      if (timeSpentSeconds <= 0) return;
      const overlap = overlaps[index] ?? 0;
      const presenceEnd = presence.leftAt ?? input.endedAt;
      const startedMs = Math.max(
        segment.startedAt.getTime(),
        presence.joinedAt.getTime(),
      );
      const stoppedMs = Math.min(segment.stoppedAt.getTime(), presenceEnd.getTime());
      const fullSegment = overlap >= segment.timeSpent && input.presences.length === 1;
      planned.push({
        subTaskId: segment.documentId,
        colaboratorId: presence.userId,
        startedAt: fullSegment ? segment.startedAt : new Date(startedMs),
        stoppedAt: fullSegment ? segment.stoppedAt : new Date(stoppedMs),
        timeSpentSeconds,
      });
    });
  }

  return planned;
}
