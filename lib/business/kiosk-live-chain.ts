import {
  DEFAULT_KIOSK_LIVE_CHAIN_INTERVAL_SECONDS,
  MAX_KIOSK_LIVE_CHAIN_INTERVAL_SECONDS,
  MIN_KIOSK_LIVE_CHAIN_INTERVAL_SECONDS,
} from "@/lib/schemas/kiosk-setting";
import {
  isDisabledChainMember,
  isFinishedChainMember,
  remainingExecutableMembers,
  resolveChains,
  type ChainSubTask,
} from "@/lib/business/subtask-chain";
import {
  hasActiveSubTask,
  hasViewerSession,
  type KioskSubTask,
} from "@/lib/business/subtask-queue";

export type LiveChainMember = {
  documentId: string;
  index: number;
  taskDocumentId: string;
  expectedTime: number;
  status: string;
  activationStatus?: string | null;
};

export function normalizeKioskLiveChainIntervalSeconds(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_KIOSK_LIVE_CHAIN_INTERVAL_SECONDS;
  }
  const rounded = Math.round(value);
  return Math.min(
    MAX_KIOSK_LIVE_CHAIN_INTERVAL_SECONDS,
    Math.max(MIN_KIOSK_LIVE_CHAIN_INTERVAL_SECONDS, rounded),
  );
}

export function sumExpectedTime(
  members: readonly { expectedTime: number }[],
): number {
  return members.reduce((sum, member) => sum + Math.max(0, member.expectedTime), 0);
}

export function canJoinLiveChain(input: {
  maxIntervalSeconds: number;
  liveMembers: readonly { expectedTime: number }[];
  candidateExpectedTime: number;
}): boolean {
  if (input.maxIntervalSeconds <= 0) return false;
  const total =
    sumExpectedTime(input.liveMembers) + Math.max(0, input.candidateExpectedTime);
  return total <= input.maxIntervalSeconds;
}

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

/** Members already in the viewer's live chain (producing isolated or group). */
export function liveChainMembersForViewer(input: {
  viewerId: string;
  subTasks: readonly KioskSubTask[];
  catalog?: readonly KioskSubTask[];
}): KioskSubTask[] {
  const catalog = input.catalog ?? input.subTasks;
  const active = input.subTasks.find((item) => hasViewerSession(item));
  if (!active) return [];

  const chains = resolveChains(catalog.map(toChainItem));
  const chain = chains.find((item) =>
    item.memberIds.includes(active.documentId),
  );
  if (!chain || chain.memberIds.length <= 1) {
    return catalog.filter((item) => item.documentId === active.documentId);
  }

  const byId = new Map(catalog.map((item) => [item.documentId, toChainItem(item)]));
  const remaining = remainingExecutableMembers(chain, byId);
  const remainingIds = new Set(remaining.map((item) => item.documentId));
  return catalog.filter((item) => remainingIds.has(item.documentId));
}

export function nextJoinableSibling(input: {
  liveMembers: readonly LiveChainMember[];
  siblings: readonly LiveChainMember[];
  viewerAssignedIds: ReadonlySet<string>;
  maxIntervalSeconds: number;
}): LiveChainMember | null {
  if (input.liveMembers.length === 0) return null;
  const taskId = input.liveMembers[0]?.taskDocumentId;
  if (!taskId) return null;
  if (input.liveMembers.some((member) => member.taskDocumentId !== taskId)) {
    return null;
  }

  const liveIds = new Set(input.liveMembers.map((member) => member.documentId));
  const tailIndex = Math.max(...input.liveMembers.map((member) => member.index));
  const next = [...input.siblings]
    .filter((item) => item.taskDocumentId === taskId)
    .filter((item) => !liveIds.has(item.documentId))
    .filter((item) => input.viewerAssignedIds.has(item.documentId))
    .filter(
      (item) =>
        !isFinishedChainMember(item) && !isDisabledChainMember(item),
    )
    .sort((left, right) => left.index - right.index)
    .find((item) => item.index > tailIndex);

  if (!next) return null;
  if (
    !canJoinLiveChain({
      maxIntervalSeconds: input.maxIntervalSeconds,
      liveMembers: input.liveMembers,
      candidateExpectedTime: next.expectedTime,
    })
  ) {
    return null;
  }
  return next;
}

export function nextJoinableSubTask(input: {
  viewerId: string;
  subTasks: readonly KioskSubTask[];
  catalog?: readonly KioskSubTask[];
  maxIntervalSeconds: number;
}): KioskSubTask | null {
  if (!hasActiveSubTask(input.subTasks)) return null;
  const liveMembers = liveChainMembersForViewer(input);
  if (liveMembers.length === 0) return null;

  const catalog = input.catalog ?? input.subTasks;
  const assignedIds = new Set(input.subTasks.map((item) => item.documentId));
  const next = nextJoinableSibling({
    liveMembers,
    siblings: catalog,
    viewerAssignedIds: assignedIds,
    maxIntervalSeconds: input.maxIntervalSeconds,
  });
  if (!next) return null;
  return catalog.find((item) => item.documentId === next.documentId) ?? null;
}
