import type { OpenChainRun } from "@/lib/business/kiosk-queue-units";
import type { ChainStopAnswer } from "@/lib/business/subtask-chain-allocation";
import type { KioskSubTask } from "@/lib/business/subtask-queue";

export const OPTIMISTIC_CHAIN_RUN_PREFIX = "optimistic:";

export function isOptimisticChainRunId(
  chainRunId: string | null | undefined,
): boolean {
  return (
    typeof chainRunId === "string" &&
    chainRunId.startsWith(OPTIMISTIC_CHAIN_RUN_PREFIX)
  );
}

export function resolvePersistedChainRunId(
  chainRunId: string | null | undefined,
  openRuns: readonly OpenChainRun[] | undefined,
  headId?: string,
): string | null {
  if (!chainRunId) return null;
  if (!isOptimisticChainRunId(chainRunId)) return chainRunId;
  const persisted = openRuns?.find(
    (run) =>
      !isOptimisticChainRunId(run.chainRunId) &&
      (run.chainHeadId === headId || run.chainRunId === chainRunId),
  );
  return persisted?.chainRunId ?? null;
}

export type OptimisticKioskStartMode = "solo" | "join" | "chain";

export type OptimisticKioskStart = {
  documentId: string;
  startedAt: string;
  mode: OptimisticKioskStartMode;
  chainHeadId?: string;
};

export function applyOptimisticKioskStartToSubTasks(
  items: readonly KioskSubTask[],
  start: OptimisticKioskStart | null,
): KioskSubTask[] {
  if (!start) return [...items];
  return items.map((item) => {
    if (item.documentId !== start.documentId) return item;
    return {
      ...item,
      status: "producing",
      startedAt: start.startedAt,
      activeWorkerCount: Math.max(1, (item.activeWorkerCount ?? 0) + 1),
    };
  });
}

export function applyOptimisticKioskStartToOpenRuns(
  openRuns: readonly OpenChainRun[] | undefined,
  start: OptimisticKioskStart | null,
  colaboratorId: string,
): OpenChainRun[] {
  const current = [...(openRuns ?? [])];
  if (!start || start.mode !== "chain") return current;
  const headId = start.chainHeadId ?? start.documentId;
  if (current.some((run) => run.chainHeadId === headId)) return current;
  current.push({
    chainHeadId: headId,
    chainRunId: `${OPTIMISTIC_CHAIN_RUN_PREFIX}${headId}`,
    principalId: colaboratorId,
    runStartedAt: start.startedAt,
  });
  return current;
}

export function isOptimisticKioskStartSettled(
  subTasks: readonly KioskSubTask[],
  start: OptimisticKioskStart,
): boolean {
  const row = subTasks.find((item) => item.documentId === start.documentId);
  return Boolean(row?.startedAt);
}

export type OptimisticKioskChainStop = {
  chainRunId: string;
  chainHeadId: string;
  memberIds: string[];
  answers: ChainStopAnswer[];
};

function resolveOptimisticChainStopStatus(
  item: KioskSubTask,
  answer: ChainStopAnswer | undefined,
): KioskSubTask["status"] {
  if (!answer) return "waiting";
  if (item.sharingType === "duration") {
    return answer.completed === true ? "finished" : "waiting";
  }
  const qty = Math.max(0, Math.floor(Number(answer.qty) || 0));
  return item.completedQty + qty >= item.targetQty ? "finished" : "waiting";
}

export function applyOptimisticChainStopToSubTasks(
  items: readonly KioskSubTask[],
  stop: OptimisticKioskChainStop | null,
): KioskSubTask[] {
  if (!stop) return [...items];
  const answersById = new Map(stop.answers.map((answer) => [answer.documentId, answer]));
  const memberIds = new Set(stop.memberIds);

  return items.map((item) => {
    if (!memberIds.has(item.documentId)) return item;
    const answer = answersById.get(item.documentId);
    const status = resolveOptimisticChainStopStatus(item, answer);
    const completedQty =
      item.sharingType === "qty" && answer && typeof answer.qty === "number"
        ? item.completedQty + Math.max(0, Math.floor(answer.qty))
        : item.completedQty;

    return {
      ...item,
      status,
      completedQty,
      startedAt: null,
      activeWorkerCount: 0,
    };
  });
}

export function applyOptimisticChainStopToOpenRuns(
  openRuns: readonly OpenChainRun[] | undefined,
  stop: OptimisticKioskChainStop | null,
): OpenChainRun[] {
  if (!stop) return [...(openRuns ?? [])];
  return (openRuns ?? []).filter(
    (run) =>
      run.chainRunId !== stop.chainRunId &&
      run.chainHeadId !== stop.chainHeadId,
  );
}

export function isOptimisticChainStopSettled(
  subTasks: readonly KioskSubTask[],
  openRuns: readonly OpenChainRun[] | undefined,
  stop: OptimisticKioskChainStop,
): boolean {
  const stillOpen = (openRuns ?? []).some(
    (run) =>
      run.chainRunId === stop.chainRunId ||
      run.chainHeadId === stop.chainHeadId,
  );
  if (stillOpen) return false;

  const memberIds = new Set(stop.memberIds);
  return subTasks
    .filter((item) => memberIds.has(item.documentId))
    .every((item) => item.status !== "producing");
}