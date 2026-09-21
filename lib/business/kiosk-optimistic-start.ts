import {
  applyQueueUnitStartVisibility,
  isProducingQueueUnit,
  queueUnitCursor,
  type KioskGroupUnit,
  type KioskIsolatedUnit,
  type KioskQueueUnit,
  type OpenChainRun,
} from "@/lib/business/kiosk-queue-units";
import type { ChainStopAnswer } from "@/lib/business/subtask-chain-allocation";
import type { KioskSubTask } from "@/lib/business/subtask-queue";
import type { KioskExitInput } from "@/lib/schemas/kiosk-exit";

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

export type OptimisticKioskExit = {
  documentId: string;
  exit: KioskExitInput;
};

function resolveOptimisticExitStatus(
  item: KioskSubTask,
  exit: KioskExitInput,
): KioskSubTask["status"] {
  if (exit.sharingType === "duration") {
    return exit.isCompleted ? "finished" : "waiting";
  }
  const qty = Math.max(0, Math.floor(exit.qtyCompleted));
  return item.completedQty + qty >= item.targetQty ? "finished" : "waiting";
}

export function applyOptimisticKioskExitToSubTasks(
  items: readonly KioskSubTask[],
  exit: OptimisticKioskExit | null,
): KioskSubTask[] {
  if (!exit) return [...items];
  return items.map((item) => {
    if (item.documentId !== exit.documentId) return item;
    const status = resolveOptimisticExitStatus(item, exit.exit);
    const completedQty =
      exit.exit.sharingType === "qty"
        ? item.completedQty + Math.max(0, Math.floor(exit.exit.qtyCompleted))
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

export function isOptimisticKioskExitSettled(
  subTasks: readonly KioskSubTask[],
  exit: OptimisticKioskExit,
): boolean {
  const row = subTasks.find((item) => item.documentId === exit.documentId);
  if (!row) return true;
  return row.status !== "producing" && !row.startedAt;
}

export type LiberadasSectionSnapshot = {
  producingUnits: KioskQueueUnit[];
  units: KioskQueueUnit[];
};

function subTasksById(
  items: readonly KioskSubTask[],
): Map<string, KioskSubTask> {
  return new Map(items.map((item) => [item.documentId, item]));
}

function findOpenRunForGroup(
  unit: KioskGroupUnit,
  openRuns: readonly OpenChainRun[],
): OpenChainRun | null {
  return (
    openRuns.find(
      (run) =>
        run.chainHeadId === unit.headId ||
        unit.memberIds.includes(run.chainHeadId),
    ) ?? null
  );
}

function patchGroupUnit(
  unit: KioskGroupUnit,
  byId: Map<string, KioskSubTask>,
  openRuns: readonly OpenChainRun[],
): KioskGroupUnit {
  const openRun = findOpenRunForGroup(unit, openRuns);
  const members = unit.memberIds.map(
    (id) => byId.get(id) ?? unit.members.find((row) => row.documentId === id)!,
  );
  const viewerActive = members.some(
    (item) => item.status === "producing" && Boolean(item.startedAt),
  );
  return {
    ...unit,
    members,
    principalActive: viewerActive,
    chainRunId: openRun?.chainRunId ?? unit.chainRunId,
    runStartedAt: openRun?.runStartedAt ?? unit.runStartedAt,
  };
}

function patchIsolatedUnit(
  unit: KioskIsolatedUnit,
  byId: Map<string, KioskSubTask>,
): KioskIsolatedUnit {
  const subTask = byId.get(unit.subTask.documentId) ?? unit.subTask;
  return { ...unit, subTask };
}

function dedupeQueueUnits(units: readonly KioskQueueUnit[]): KioskQueueUnit[] {
  const seen = new Set<string>();
  const unique: KioskQueueUnit[] = [];
  for (const unit of units) {
    const key = queueUnitCursor(unit);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(unit);
  }
  return unique;
}

/** Re-splits liberadas cards so producing rows surface immediately during optimistic UI. */
export function applyOptimisticStateToLiberadasSection(
  section: LiberadasSectionSnapshot,
  queueContext: readonly KioskSubTask[],
  openRuns: readonly OpenChainRun[],
  colaboratorId: string,
  maxSimultaneousSubtaskIntervalSeconds = 0,
  catalog: readonly KioskSubTask[] = queueContext,
): LiberadasSectionSnapshot {
  const byId = subTasksById(queueContext);
  const patched = dedupeQueueUnits([
    ...section.producingUnits,
    ...section.units,
  ]).map((unit) =>
    unit.type === "group"
      ? patchGroupUnit(unit, byId, openRuns)
      : patchIsolatedUnit(unit, byId),
  );
  const withStart = applyQueueUnitStartVisibility(patched, {
    viewerId: colaboratorId,
    subTasks: queueContext,
    allTaskSubTasks: catalog.length > 0 ? catalog : queueContext,
    maxSimultaneousSubtaskIntervalSeconds,
  });

  const producingUnits: KioskQueueUnit[] = [];
  const pendingUnits: KioskQueueUnit[] = [];
  for (const unit of withStart) {
    if (isProducingQueueUnit(unit)) producingUnits.push(unit);
    else pendingUnits.push(unit);
  }

  return { producingUnits, units: pendingUnits };
}