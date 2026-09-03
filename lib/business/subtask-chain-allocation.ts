const MS_PER_SECOND = 1000;

export type AllocationSharingType = "qty" | "duration";

export type AllocationMember = {
  documentId: string;
  expectedTime: number;
  sharingType: AllocationSharingType;
  targetQty: number;
  completedQtyBefore: number;
};

export type ChainStopAnswer = {
  documentId: string;
  completed?: boolean;
  qty?: number;
  flagIds?: string[];
  /** Explicit Sem bandeira after refresh found none available. */
  semBandeira?: boolean;
  /** Latest available flag count after optional refresh. */
  availableFlagCount?: number;
};

export type AllocationSegment = {
  documentId: string;
  timeSpent: number;
  startedAt: Date;
  stoppedAt: Date;
};

export type ChainMemberFlagGate = {
  requiresMaterialFlagsOnFinish?: boolean;
  categoryId?: string | null;
  availableFlagCount?: number;
  /** Explicit Sem bandeira after refresh found none available. */
  semBandeiraSelected?: boolean;
  targetQty?: number;
  completedQty?: number;
};

export function isChainMemberAnswerComplete(
  sharingType: AllocationSharingType,
  answer: ChainStopAnswer | undefined,
  flagGate?: ChainMemberFlagGate,
): boolean {
  if (!answer) return false;
  const baseOk =
    sharingType === "duration"
      ? typeof answer.completed === "boolean"
      : typeof answer.qty === "number" &&
        Number.isInteger(answer.qty) &&
        answer.qty >= 0;
  if (!baseOk) return false;

  if (!flagGate?.requiresMaterialFlagsOnFinish) return true;

  const willFinish =
    sharingType === "duration"
      ? answer.completed === true
      : isFinishedThisRun(
          {
            documentId: answer.documentId,
            expectedTime: 0,
            sharingType,
            targetQty: Math.max(1, flagGate.targetQty ?? 1),
            completedQtyBefore: Math.max(0, flagGate.completedQty ?? 0),
          },
          answer,
        );

  if (!willFinish) return true;
  if (!flagGate.categoryId) return true;
  const available = flagGate.availableFlagCount ?? 0;
  if (available > 0) return (answer.flagIds?.length ?? 0) >= 1;
  return answer.semBandeira === true || flagGate.semBandeiraSelected === true;
}

export function resolveInitialMaterialFlagIds(member: {
  availableFlags?: ReadonlyArray<{ id: string; code: string }>;
  assignedFlagCodes?: readonly string[];
}): string[] {
  const codes = new Set(member.assignedFlagCodes ?? []);
  return (member.availableFlags ?? [])
    .filter((flag) => codes.has(flag.code))
    .map((flag) => flag.id);
}

export function buildInitialChainStopAnswers(
  members: readonly {
    documentId: string;
    sharingType: AllocationSharingType;
    status: string;
    targetQty: number;
    completedQty: number;
    availableFlags?: ReadonlyArray<{ id: string; code: string }>;
    assignedFlagCodes?: readonly string[];
  }[],
): Record<string, ChainStopAnswer> {
  const answers: Record<string, ChainStopAnswer> = {};
  for (const member of members) {
  const flagIds = resolveInitialMaterialFlagIds(member);
  const flagPayload = {
    ...(flagIds.length > 0 ? { flagIds } : {}),
    availableFlagCount: member.availableFlags?.length ?? 0,
  };
    if (member.sharingType === "duration") {
      if (member.status === "finished") {
        answers[member.documentId] = {
          documentId: member.documentId,
          completed: true,
          ...flagPayload,
        };
      }
      continue;
    }
    const remaining = Math.max(
      0,
      member.targetQty - Math.max(0, member.completedQty),
    );
    if (remaining === 0) {
      answers[member.documentId] = {
        documentId: member.documentId,
        qty: 0,
        ...flagPayload,
      };
    }
  }
  return answers;
}

export function isFinishedThisRun(
  member: AllocationMember,
  answer: ChainStopAnswer | undefined,
): boolean {
  if (!answer) return false;
  if (member.sharingType === "duration") {
    return answer.completed === true;
  }
  const qty = Math.max(0, Math.floor(Number(answer.qty) || 0));
  return member.completedQtyBefore + qty >= member.targetQty;
}

export function elapsedSecondsBetween(startedAt: Date, stoppedAt: Date): number {
  const deltaMs = stoppedAt.getTime() - startedAt.getTime();
  if (!Number.isFinite(deltaMs) || deltaMs <= 0) return 0;
  return Math.floor(deltaMs / MS_PER_SECOND);
}

function splitElapsedByExpected(
  elapsedSeconds: number,
  expectedTimes: number[],
): number[] {
  if (expectedTimes.length === 0) return [];
  const expectedSum = expectedTimes.reduce((sum, value) => sum + value, 0);
  if (elapsedSeconds <= 0) {
    return expectedTimes.map(() => 0);
  }
  if (expectedSum <= 0) {
    const even = Math.floor(elapsedSeconds / expectedTimes.length);
    const parts = expectedTimes.map(() => even);
    parts[parts.length - 1] =
      elapsedSeconds - even * (expectedTimes.length - 1);
    return parts;
  }

  const parts = expectedTimes.map((expected) =>
    Math.floor((elapsedSeconds * expected) / expectedSum),
  );
  const assigned = parts.reduce((sum, value) => sum + value, 0);
  const remainder = elapsedSeconds - assigned;
  parts[parts.length - 1] = (parts[parts.length - 1] ?? 0) + remainder;
  return parts;
}

/**
 * Contiguous timeline for members finished in this run.
 * Extra helper seconds are added to wall-clock elapsed.
 */
export function allocateChainTimeline(input: {
  runStartedAt: Date;
  stopAt: Date;
  extraHelperSeconds?: number;
  finishedThisRun: readonly Pick<AllocationMember, "documentId" | "expectedTime">[];
}): {
  elapsedSeconds: number;
  expectedSum: number;
  segments: AllocationSegment[];
} {
  const extra = Math.max(0, Math.floor(input.extraHelperSeconds ?? 0));
  const wall = elapsedSecondsBetween(input.runStartedAt, input.stopAt);
  const elapsedSeconds = wall + extra;
  const expectedTimes = input.finishedThisRun.map((item) =>
    Math.max(0, item.expectedTime),
  );
  const expectedSum = expectedTimes.reduce((sum, value) => sum + value, 0);
  const parts = splitElapsedByExpected(elapsedSeconds, expectedTimes);

  const segments: AllocationSegment[] = [];
  let cursorMs = input.runStartedAt.getTime();
  input.finishedThisRun.forEach((member, index) => {
    const timeSpent = parts[index] ?? 0;
    const startedAt = new Date(cursorMs);
    const stoppedAt = new Date(cursorMs + timeSpent * MS_PER_SECOND);
    segments.push({
      documentId: member.documentId,
      timeSpent,
      startedAt,
      stoppedAt,
    });
    cursorMs = stoppedAt.getTime();
  });

  return { elapsedSeconds, expectedSum, segments };
}

export type AutoAdvanceState = {
  completedIds: string[];
  currentId: string | null;
};

/**
 * Auto-advance uses raw expected times from run start. The last remaining
 * member never auto-stops.
 */
export function resolveChainAutoAdvance(input: {
  runStartedAt: Date;
  now: Date;
  remainingOrdered: readonly Pick<AllocationMember, "documentId" | "expectedTime">[];
}): AutoAdvanceState {
  const remaining = input.remainingOrdered;
  if (remaining.length === 0) {
    return { completedIds: [], currentId: null };
  }
  if (remaining.length === 1) {
    return { completedIds: [], currentId: remaining[0]!.documentId };
  }

  const elapsed = elapsedSecondsBetween(input.runStartedAt, input.now);
  const completedIds: string[] = [];
  let cumulative = 0;

  for (let index = 0; index < remaining.length - 1; index += 1) {
    const member = remaining[index]!;
    cumulative += Math.max(0, member.expectedTime);
    if (elapsed < cumulative) {
      return { completedIds, currentId: member.documentId };
    }
    completedIds.push(member.documentId);
  }

  return {
    completedIds,
    currentId: remaining[remaining.length - 1]!.documentId,
  };
}

/**
 * Time-based chain roll is optimistic: the left-behind member is paused
 * until the principal confirms finish on stop. Helpers still on it stay
 * producing.
 */
export function statusAfterChainTimeAdvance(
  helperStillOpen: boolean,
): "producing" | "paused" {
  return helperStillOpen ? "producing" : "paused";
}

export type PlannedActivity = {
  subTaskId: string;
  colaboratorId: string;
  action: "started" | "stoped";
  timestamp: Date;
  qty: number;
};

export function planPrincipalSegmentActivities(input: {
  principalId: string;
  segments: readonly AllocationSegment[];
  qtyBySubTaskId?: Readonly<Record<string, number>>;
}): PlannedActivity[] {
  const planned: PlannedActivity[] = [];
  for (const segment of input.segments) {
    const qty = Math.max(0, input.qtyBySubTaskId?.[segment.documentId] ?? 0);
    planned.push({
      subTaskId: segment.documentId,
      colaboratorId: input.principalId,
      action: "started",
      timestamp: segment.startedAt,
      qty: 0,
    });
    planned.push({
      subTaskId: segment.documentId,
      colaboratorId: input.principalId,
      action: "stoped",
      timestamp: segment.stoppedAt,
      qty,
    });
  }
  return planned;
}

export function msUntilNextAutoAdvance(input: {
  runStartedAt: Date;
  now: Date;
  remainingOrdered: readonly Pick<AllocationMember, "documentId" | "expectedTime">[];
}): number | null {
  const remaining = input.remainingOrdered;
  if (remaining.length <= 1) return null;

  const elapsed = elapsedSecondsBetween(input.runStartedAt, input.now);
  let cumulative = 0;
  for (let index = 0; index < remaining.length - 1; index += 1) {
    cumulative += Math.max(0, remaining[index]!.expectedTime);
    if (elapsed < cumulative) {
      return (cumulative - elapsed) * MS_PER_SECOND;
    }
  }
  return null;
}
