import {
  chainHasExternalDependencyBlock,
  findChainContaining,
  isDisabledChainMember,
  isFinishedChainMember,
  isMultiMemberChain,
  remainingExecutableMembers,
  resolveChains,
  type ChainSubTask,
  type SubTaskChain,
} from "@/lib/business/subtask-chain";
import type { KioskSubTask } from "@/lib/business/subtask-queue";
import { isSubTaskAtWorkerCapacity } from "@/lib/business/subtask-active-workers";

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
};

export type KioskIsolatedUnit = {
  type: "isolated";
  subTask: KioskSubTask;
  helperMode: boolean;
};

export type KioskQueueUnit = KioskGroupUnit | KioskIsolatedUnit;

function toChainItem(subTask: KioskSubTask): ChainSubTask {
  return {
    documentId: subTask.documentId,
    index: subTask.index,
    status: subTask.status,
    activationStatus: subTask.activationStatus,
    linkedToPrevious: subTask.linkedToPrevious ?? false,
    maxSameTimeWorkers: subTask.maxSameTimeWorkers ?? 1,
    assignedToIds: subTask.assignedToIds ?? [],
    dependencyIds: subTask.dependencyIds ?? [],
  };
}

function siblingsById(
  items: readonly KioskSubTask[],
): Map<string, Pick<ChainSubTask, "status">> {
  return new Map(
    items.map((item) => [item.documentId, { status: item.status }]),
  );
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
 * Builds kiosk cards: multi-member chains as one group for the principal
 * (or before start); helpers only see spare-capacity members in isolation.
 */
export function buildKioskQueueUnits(input: {
  viewerId: string;
  subTasks: readonly KioskSubTask[];
  allTaskSubTasks?: readonly KioskSubTask[];
  openRuns?: readonly OpenChainRun[];
}): KioskQueueUnit[] {
  const catalog = input.allTaskSubTasks ?? input.subTasks;
  const chains = resolveChains(catalog.map(toChainItem));
  const byId = new Map(catalog.map((item) => [item.documentId, item]));
  const chainItemsById = new Map(
    catalog.map((item) => [item.documentId, toChainItem(item)]),
  );
  const openRuns = input.openRuns ?? [];
  const viewerIds = new Set(input.subTasks.map((item) => item.documentId));
  const consumed = new Set<string>();
  const units: KioskQueueUnit[] = [];
  const siblings = siblingsById(catalog);

  for (const subTask of input.subTasks) {
    if (consumed.has(subTask.documentId)) continue;
    if (isDisabledChainMember(toChainItem(subTask))) continue;

    const chain = findChainContaining(chains, subTask.documentId);
    if (!chain || !isMultiMemberChain(chain)) {
      consumed.add(subTask.documentId);
      units.push({ type: "isolated", subTask, helperMode: false });
      continue;
    }

    const remaining = remainingExecutableMembers(chain, chainItemsById);
    const remainingSubTasks = remaining
      .map((item) => byId.get(item.documentId))
      .filter((item): item is KioskSubTask => Boolean(item));
    const openRun = findOpenRun(chain, openRuns);
    const principalActive = Boolean(openRun);
    const viewerIsPrincipal = openRun?.principalId === input.viewerId;
    const locked = chainHasExternalDependencyBlock(
      new Set(chain.memberIds),
      remaining,
      siblings,
    );

    if (remainingSubTasks.length === 0) {
      consumed.add(subTask.documentId);
      if (isFinishedChainMember(toChainItem(subTask))) {
        units.push({ type: "isolated", subTask, helperMode: false });
      }
      continue;
    }

    if (principalActive && !viewerIsPrincipal) {
      if (
        isFinishedChainMember(toChainItem(subTask)) ||
        !viewerIds.has(subTask.documentId)
      ) {
        consumed.add(subTask.documentId);
        continue;
      }
      const maxWorkers = subTask.maxSameTimeWorkers ?? 1;
      const atCapacity = isSubTaskAtWorkerCapacity(
        maxWorkers,
        subTask.activeWorkerCount,
      );
      const hasSpare = maxWorkers > 1 && !atCapacity;
      consumed.add(subTask.documentId);
      if (hasSpare) {
        units.push({ type: "isolated", subTask, helperMode: true });
      }
      continue;
    }

    const remainingHead = remainingSubTasks[0];
    const viewerOnRemainingHead = Boolean(
      remainingHead?.assignedToIds?.includes(input.viewerId),
    );
    if (!principalActive && !viewerOnRemainingHead) {
      consumed.add(subTask.documentId);
      continue;
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
      principalActive: viewerIsPrincipal,
      chainRunId: viewerIsPrincipal ? (openRun?.chainRunId ?? null) : null,
      runStartedAt: viewerIsPrincipal
        ? (openRun?.runStartedAt ?? null)
        : null,
    });
  }

  return units;
}

export function splitQueueUnitsBySection(units: readonly KioskQueueUnit[]): {
  producing: KioskQueueUnit[];
  pending: KioskQueueUnit[];
  finishedToday: KioskQueueUnit[];
} {
  const producing: KioskQueueUnit[] = [];
  const pending: KioskQueueUnit[] = [];
  const finishedToday: KioskQueueUnit[] = [];

  for (const unit of units) {
    if (unit.type === "isolated") {
      if (unit.subTask.status === "producing") producing.push(unit);
      else if (unit.subTask.status === "finished") finishedToday.push(unit);
      else pending.push(unit);
      continue;
    }
    const hasProducing = unit.members.some((item) => item.status === "producing");
    const allFinished =
      unit.members.length > 0 &&
      unit.members.every((item) => item.status === "finished");
    if (hasProducing || unit.principalActive) producing.push(unit);
    else if (allFinished) finishedToday.push(unit);
    else pending.push(unit);
  }

  return { producing, pending, finishedToday };
}
