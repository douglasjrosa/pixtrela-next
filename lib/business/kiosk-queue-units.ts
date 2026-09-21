import {
  chainHasExternalDependencyBlock,
  findChainContaining,
  isDisabledChainMember,
  isFinishedChainMember,
  isMultiMemberChain,
  remainingExecutableMembers,
  resolveChainsByTask,
  type ChainSubTask,
  type SubTaskChain,
} from "@/lib/business/subtask-chain";
import { isSubTaskAtWorkerCapacity } from "@/lib/business/subtask-active-workers";
import { nextJoinableSubTask } from "@/lib/business/kiosk-live-chain";
import {
  canStartSubTask,
  hasActiveSubTask,
  isLockedSubTask,
  type KioskSubTask,
} from "@/lib/business/subtask-queue";

export type KioskChainMeta = ChainSubTask;

export type OpenChainRun = {
  chainHeadId: string;
  chainRunId: string;
  principalId: string;
  runStartedAt: string;
};

export type KioskGroupUnit = {
  type: "group";
  headId: string;
  memberIds: string[];
  members: KioskSubTask[];
  locked: boolean;
  principalActive: boolean;
  chainRunId: string | null;
  runStartedAt: string | null;
  showStart: boolean;
};

export type KioskIsolatedUnit = {
  type: "isolated";
  subTask: KioskSubTask;
  helperMode: boolean;
  showStart: boolean;
};

export type KioskQueueUnit = KioskGroupUnit | KioskIsolatedUnit;

function toChainItem(
  subTask: KioskSubTask,
): ChainSubTask & { taskDocumentId: string } {
  return {
    documentId: subTask.documentId,
    index: subTask.index,
    status: subTask.status,
    activationStatus: subTask.activationStatus,
    linkedToPrevious: subTask.linkedToPrevious ?? false,
    maxSameTimeWorkers: subTask.maxSameTimeWorkers ?? 1,
    assignedToIds: subTask.assignedToIds ?? [],
    dependencyIds: subTask.dependencyIds ?? [],
    hasAssignedFlags: (subTask.assignedFlagCodes?.length ?? 0) > 0,
    taskDocumentId: subTask.taskDocumentId,
  };
}

function siblingsById(
  items: readonly KioskSubTask[],
): Map<string, Pick<ChainSubTask, "status" | "hasAssignedFlags">> {
  return new Map(
    items.map((item) => [
      item.documentId,
      {
        status: item.status,
        hasAssignedFlags: (item.assignedFlagCodes?.length ?? 0) > 0,
      },
    ]),
  );
}

function viewerIsActiveOnMembers(
  members: readonly KioskSubTask[],
): boolean {
  return members.some(
    (item) => item.status === "producing" && Boolean(item.startedAt),
  );
}

export function groupHasJoinSlot(
  members: readonly KioskSubTask[],
  viewerId: string,
): boolean {
  const qtyChain = members.some((item) => item.sharingType === "qty");
  return members.some((item) => {
    if (!(item.assignedToIds ?? []).includes(viewerId)) return false;
    if (item.startedAt) return false;
    if (isFinishedChainMember(toChainItem(item))) return false;
    if (!qtyChain && item.status !== "producing") return false;
    return !isSubTaskAtWorkerCapacity(
      item.maxSameTimeWorkers ?? 1,
      item.activeWorkerCount,
    );
  });
}

export function chainHasOtherActiveWorkers(
  members: readonly KioskSubTask[],
): boolean {
  return members.some((item) => {
    const viewerHere = Boolean(item.startedAt);
    const activeCount = item.activeWorkerCount ?? 0;
    if (viewerHere) return activeCount > 1;
    return activeCount > 0 || item.status === "producing";
  });
}

export function viewerWorkedChainMemberIds(
  members: readonly KioskSubTask[],
): string[] {
  const worked = members.filter(
    (item) => item.viewerWorkedThisRun === true || Boolean(item.startedAt),
  );
  if (worked.length > 0) {
    return worked.map((item) => item.documentId);
  }
  return members.map((item) => item.documentId);
}

function findOpenRun(
  chain: SubTaskChain,
  openRuns: readonly OpenChainRun[],
): OpenChainRun | null {
  return (
    openRuns.find(
      (run) =>
        run.chainHeadId === chain.headId ||
        chain.memberIds.includes(run.chainHeadId),
    ) ??
    openRuns.find((run) => chain.memberIds.includes(run.chainHeadId)) ??
    null
  );
}

/**
 * Builds kiosk cards: multi-member chains as one group for every assignee
 * in the shared session (no helper isolation).
 */
export function buildKioskQueueUnits(input: {
  viewerId: string;
  subTasks: readonly KioskSubTask[];
  allTaskSubTasks?: readonly KioskSubTask[];
  openRuns?: readonly OpenChainRun[];
  maxSimultaneousSubtaskIntervalSeconds?: number;
}): KioskQueueUnit[] {
  const catalog = input.allTaskSubTasks ?? input.subTasks;
  const chains = resolveChainsByTask(catalog.map(toChainItem));
  const byId = new Map(catalog.map((item) => [item.documentId, item]));
  const chainItemsById = new Map(
    catalog.map((item) => [item.documentId, toChainItem(item)]),
  );
  const openRuns = input.openRuns ?? [];
  const consumed = new Set<string>();
  const units: KioskQueueUnit[] = [];
  const siblings = siblingsById(catalog);

  for (const subTask of input.subTasks) {
    if (consumed.has(subTask.documentId)) continue;
    if (isDisabledChainMember(toChainItem(subTask))) continue;

    const chain = findChainContaining(chains, subTask.documentId);
    const remaining = chain
      ? remainingExecutableMembers(chain, chainItemsById)
      : [];
    const remainingSubTasks = remaining
      .map((item) => byId.get(item.documentId))
      .filter((item): item is KioskSubTask => Boolean(item));
    if (!chain || !isMultiMemberChain(chain) || remainingSubTasks.length <= 1) {
      const leftoverOther =
        Boolean(chain) &&
        remainingSubTasks[0] &&
        remainingSubTasks[0].documentId !== subTask.documentId;
      if (leftoverOther) {
        consumed.add(subTask.documentId);
        continue;
      }
      consumed.add(subTask.documentId);
      units.push({
        type: "isolated",
        subTask,
        helperMode: false,
        showStart: false,
      });
      continue;
    }
    const openRun = findOpenRun(chain, openRuns);
    const viewerActive = viewerIsActiveOnMembers(remainingSubTasks);
    const locked = chainHasExternalDependencyBlock(
      new Set(chain.memberIds),
      remaining,
      siblings,
    );

    const viewerAssigned = remainingSubTasks.some((item) =>
      (item.assignedToIds ?? []).includes(input.viewerId),
    );
    if (!viewerAssigned) {
      consumed.add(subTask.documentId);
      continue;
    }
    if (!openRun) {
      const remainingHead = remainingSubTasks[0];
      const viewerOnHead = Boolean(
        remainingHead?.assignedToIds?.includes(input.viewerId),
      );
      if (!viewerOnHead) {
        consumed.add(subTask.documentId);
        continue;
      }
    }

    for (const member of remainingSubTasks) {
      consumed.add(member.documentId);
    }

    units.push({
      type: "group",
      headId: remainingSubTasks[0]!.documentId,
      memberIds: remainingSubTasks.map((item) => item.documentId),
      members: remainingSubTasks,
      locked,
      principalActive: viewerActive,
      chainRunId: openRun?.chainRunId ?? null,
      runStartedAt: openRun?.runStartedAt ?? null,
      showStart: false,
    });
  }

  return applyQueueUnitStartVisibility(units, input);
}

export function applyQueueUnitStartVisibility(
  units: KioskQueueUnit[],
  input: {
    viewerId: string;
    subTasks: readonly KioskSubTask[];
    allTaskSubTasks?: readonly KioskSubTask[];
    maxSimultaneousSubtaskIntervalSeconds?: number;
  },
): KioskQueueUnit[] {
  const queueContext = input.allTaskSubTasks ?? input.subTasks;
  const hasActive = hasActiveSubTask(queueContext);
  const joinable = nextJoinableSubTask({
    viewerId: input.viewerId,
    subTasks: input.subTasks,
    catalog: queueContext,
    maxIntervalSeconds: input.maxSimultaneousSubtaskIntervalSeconds ?? 0,
  });
  const joinableId = joinable?.documentId ?? null;
  const queue = [...queueContext];
  let idleStartGranted = false;

  return units.map((unit) => {
    if (unit.type === "group") {
      if (unit.chainRunId) {
        const canJoin =
          !unit.locked && groupHasJoinSlot(unit.members, input.viewerId);
        if (canJoin && !hasActive) {
          if (idleStartGranted) {
            return { ...unit, showStart: false };
          }
          idleStartGranted = true;
        }
        return { ...unit, showStart: canJoin };
      }
      if (unit.principalActive || isProducingQueueUnit(unit)) {
        return { ...unit, showStart: false };
      }
      const showStart =
        !hasActive && !unit.locked && !idleStartGranted;
      if (showStart) idleStartGranted = true;
      return { ...unit, showStart };
    }

    if (unit.helperMode) {
      return {
        ...unit,
        showStart: canStartSubTask(queue, unit.subTask.documentId),
      };
    }

    if (joinableId && unit.subTask.documentId === joinableId) {
      return { ...unit, showStart: true };
    }

    if (unit.subTask.startedAt) {
      return { ...unit, showStart: false };
    }

    if (isProducingQueueUnit(unit)) {
      const activeCount = unit.subTask.activeWorkerCount ?? 0;
      const atCapacity = isSubTaskAtWorkerCapacity(
        unit.subTask.maxSameTimeWorkers ?? 1,
        activeCount,
      );
      const showStart =
        !hasActive &&
        !idleStartGranted &&
        activeCount > 0 &&
        !atCapacity &&
        canStartSubTask(queue, unit.subTask.documentId);
      if (showStart) idleStartGranted = true;
      return { ...unit, showStart };
    }

    const idleStart =
      !hasActive &&
      !idleStartGranted &&
      canStartSubTask(queue, unit.subTask.documentId);
    if (idleStart) idleStartGranted = true;
    return { ...unit, showStart: idleStart };
  });
}

function isLockedQueueUnit(unit: KioskQueueUnit): boolean {
  if (unit.type === "group") return unit.locked;
  return isLockedSubTask(unit.subTask);
}

export function isProducingQueueUnit(unit: KioskQueueUnit): boolean {
  if (unit.type === "isolated") {
    return (
      unit.subTask.status === "producing" || Boolean(unit.subTask.startedAt)
    );
  }
  return (
    unit.principalActive ||
    Boolean(unit.chainRunId) ||
    unit.members.some(
      (item) => item.status === "producing" || Boolean(item.startedAt),
    )
  );
}

function isFinishedQueueUnit(unit: KioskQueueUnit): boolean {
  if (unit.type === "isolated") return unit.subTask.status === "finished";
  return (
    unit.members.length > 0 &&
    unit.members.every((item) => item.status === "finished")
  );
}

function sortPendingUnitsByLock(units: KioskQueueUnit[]): KioskQueueUnit[] {
  const unlocked: KioskQueueUnit[] = [];
  const locked: KioskQueueUnit[] = [];
  for (const unit of units) {
    if (isLockedQueueUnit(unit)) locked.push(unit);
    else unlocked.push(unit);
  }
  return [...unlocked, ...locked];
}

/** @deprecated Prefer splitQueueUnitsByKioskSection for the paginated queue UI. */
export function splitQueueUnitsBySection(units: readonly KioskQueueUnit[]): {
  producing: KioskQueueUnit[];
  pending: KioskQueueUnit[];
  finishedToday: KioskQueueUnit[];
} {
  const producing: KioskQueueUnit[] = [];
  const pending: KioskQueueUnit[] = [];
  const finishedToday: KioskQueueUnit[] = [];

  for (const unit of units) {
    if (isProducingQueueUnit(unit)) producing.push(unit);
    else if (isFinishedQueueUnit(unit)) finishedToday.push(unit);
    else pending.push(unit);
  }

  return {
    producing,
    pending: sortPendingUnitsByLock(pending),
    finishedToday,
  };
}

export type KioskQueueSectionKey =
  | "liberadas"
  | "bloqueadas"
  | "finalizadas_hoje";

export type KioskQueueSectionSplit = {
  /** Always shown at the top of Liberadas (not paginated). */
  producing: KioskQueueUnit[];
  /** Unlocked pending cards in Liberadas (paginated). */
  unlockedPending: KioskQueueUnit[];
  /** Locked pending cards (accordion). */
  locked: KioskQueueUnit[];
  /** Finished today cards (accordion). */
  finishedToday: KioskQueueUnit[];
};

export function splitQueueUnitsByKioskSection(
  units: readonly KioskQueueUnit[],
): KioskQueueSectionSplit {
  const producing: KioskQueueUnit[] = [];
  const unlockedPending: KioskQueueUnit[] = [];
  const locked: KioskQueueUnit[] = [];
  const finishedToday: KioskQueueUnit[] = [];

  for (const unit of units) {
    if (isProducingQueueUnit(unit)) {
      producing.push(unit);
      continue;
    }
    if (isFinishedQueueUnit(unit)) {
      finishedToday.push(unit);
      continue;
    }
    if (isLockedQueueUnit(unit)) locked.push(unit);
    else unlockedPending.push(unit);
  }

  return { producing, unlockedPending, locked, finishedToday };
}

export function queueUnitCursor(unit: KioskQueueUnit): string {
  return unit.type === "group" ? unit.headId : unit.subTask.documentId;
}

export function paginateQueueUnits(
  units: readonly KioskQueueUnit[],
  options: { limit: number; cursor?: string | null },
): {
  units: KioskQueueUnit[];
  nextCursor: string | null;
  hasMore: boolean;
} {
  const limit = Math.max(1, Math.trunc(options.limit));
  let startIndex = 0;
  if (options.cursor) {
    const cursorIndex = units.findIndex(
      (unit) => queueUnitCursor(unit) === options.cursor,
    );
    startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
  }

  // Units are already isolated cards or complete chain groups, so taking N
  // units never splits a chain mid-card. Limit may still be exceeded only if
  // a future caller flattens members — keep groups atomic by construction.
  const page = units.slice(startIndex, startIndex + limit);
  const endIndex = startIndex + page.length;
  const hasMore = endIndex < units.length;
  const last = page[page.length - 1];
  return {
    units: page,
    nextCursor: hasMore && last ? queueUnitCursor(last) : null,
    hasMore,
  };
}
