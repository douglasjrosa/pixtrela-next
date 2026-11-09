export type SharingType = "qty" | "duration";

export type SubTaskStatus = "finished" | "waiting" | "producing" | "paused";

const PAUSED_STATUS = "paused" as const satisfies SubTaskStatus;
const FINISHED_STATUS = "finished" as const satisfies SubTaskStatus;
const PRODUCING_STATUS = "producing" as const satisfies SubTaskStatus;

export interface KioskStopBody {
  completed?: boolean;
  isCompleted?: boolean;
  qty?: number;
  flagIds?: string[];
}

export interface KioskStopResult {
  qty: number;
  subTaskStatus: SubTaskStatus;
}

export function parseDurationStopBody(body: KioskStopBody): boolean {
  const completed = body.completed ?? body.isCompleted;
  if (typeof completed !== "boolean") {
    throw new Error("completed required");
  }
  return completed;
}

export function parseQtyStopBody(body: KioskStopBody): number {
  const qty = body.qty;
  if (typeof qty !== "number" || !Number.isInteger(qty) || qty < 0) {
    throw new Error("qty required");
  }
  return qty;
}

export function resolveDurationStop(reportedCompleted: boolean): KioskStopResult {
  return {
    qty: 0,
    subTaskStatus: reportedCompleted ? FINISHED_STATUS : PAUSED_STATUS,
  };
}

/** totalCompletedQty sums stoped activity qty from all colaborators. */
export function resolveQtyStop(
  subTaskQty: number,
  totalCompletedQty: number,
  sessionQty: number,
): KioskStopResult {
  const targetQty = Math.max(1, subTaskQty);
  const remaining = targetQty - totalCompletedQty;

  if (sessionQty < 0) {
    throw new Error("qty exceeds sub-task quantity");
  }

  if (remaining <= 0) {
    if (sessionQty !== 0) {
      throw new Error("qty exceeds sub-task quantity");
    }
    return {
      qty: 0,
      subTaskStatus: totalCompletedQty >= targetQty ? FINISHED_STATUS : PAUSED_STATUS,
    };
  }

  if (sessionQty > remaining) {
    throw new Error("qty exceeds sub-task quantity");
  }

  const totalCompleted = totalCompletedQty + sessionQty;
  return {
    qty: sessionQty,
    subTaskStatus: totalCompleted >= targetQty ? FINISHED_STATUS : PAUSED_STATUS,
  };
}

export function isQtyTargetFullyMet(
  subTaskQty: number,
  totalCompletedQty: number,
): boolean {
  return totalCompletedQty >= Math.max(1, subTaskQty);
}

export function shouldFinalizeSubTaskOnStop(
  baseStopResult: KioskStopResult,
  qtyTargetMet: boolean,
): boolean {
  return qtyTargetMet || baseStopResult.subTaskStatus === FINISHED_STATUS;
}

export type KioskOperationalStatus = SubTaskStatus;

export function resolveKioskStopNextStatus(input: {
  baseStopResult: KioskStopResult;
  shouldFinalize: boolean;
  isHelper: boolean;
  hasOpenRun: boolean;
  remainingPeerCount: number;
}): KioskStopResult & { nextStatus: KioskOperationalStatus } {
  const shouldFinalize = input.shouldFinalize;

  const helperSafeBase =
    input.isHelper &&
    input.hasOpenRun &&
    input.baseStopResult.subTaskStatus === FINISHED_STATUS &&
    !shouldFinalize
      ? { ...input.baseStopResult, subTaskStatus: PAUSED_STATUS }
      : input.baseStopResult;

  const stopResult = shouldFinalize
    ? { ...helperSafeBase, subTaskStatus: FINISHED_STATUS }
    : resolveStopStatusWithPeers(helperSafeBase, input.remainingPeerCount);

  const nextStatus: KioskOperationalStatus = shouldFinalize
    ? FINISHED_STATUS
    : input.isHelper &&
        input.remainingPeerCount === 0 &&
        stopResult.subTaskStatus !== FINISHED_STATUS
      ? input.hasOpenRun
        ? PAUSED_STATUS
        : stopResult.subTaskStatus
      : stopResult.subTaskStatus;

  return { ...stopResult, nextStatus };
}

/**
 * When other colaborators are still active, keep the sub-task producing and
 * never mark it finished — even if this session reported completion/qty.
 */
export function resolveStopStatusWithPeers(
  base: KioskStopResult,
  remainingActiveWorkerCount: number,
): KioskStopResult {
  if (remainingActiveWorkerCount <= 0) return base;
  return {
    qty: base.qty,
    subTaskStatus: PRODUCING_STATUS,
  };
}

/**
 * Stop is authorized by an open started session, not by current assignment.
 */
export function canAuthorizeKioskStop(hasOpenStartedSession: boolean): boolean {
  return hasOpenStartedSession;
}

/**
 * Keep the sub-task on the kiosk queue while assigned OR while the viewer still
 * has an open started session (even after being unassigned mid-work).
 */
export function shouldKeepSubTaskOnKioskQueue(input: {
  isAssigned: boolean;
  hasOpenStartedSession: boolean;
}): boolean {
  return input.isAssigned || input.hasOpenStartedSession;
}
