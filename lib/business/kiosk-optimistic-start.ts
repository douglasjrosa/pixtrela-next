import type { OpenChainRun } from "@/lib/business/kiosk-queue-units";
import type { KioskSubTask } from "@/lib/business/subtask-queue";

export const OPTIMISTIC_CHAIN_RUN_PREFIX = "optimistic:";

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