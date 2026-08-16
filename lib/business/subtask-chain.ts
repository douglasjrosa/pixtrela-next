const FINISHED_STATUS = "finished";
const DISABLED_ACTIVATION = "disabled";

export type ChainSubTask = {
  documentId: string;
  index: number;
  status: string;
  activationStatus?: string | null;
  linkedToPrevious: boolean;
  maxSameTimeWorkers: number;
  assignedToIds: string[];
  dependencyIds: string[];
};

export type SubTaskChain = {
  headId: string;
  memberIds: string[];
};

export function sortChainSubTasks<T extends { index: number }>(
  items: readonly T[],
): T[] {
  return [...items].sort((left, right) => left.index - right.index);
}

export function isDisabledChainMember(
  item: Pick<ChainSubTask, "activationStatus">,
): boolean {
  return item.activationStatus === DISABLED_ACTIVATION;
}

export function isFinishedChainMember(
  item: Pick<ChainSubTask, "status">,
): boolean {
  return item.status === FINISHED_STATUS;
}

/** Consecutive chains from `linkedToPrevious` in index order. */
export function resolveChains(
  items: readonly ChainSubTask[],
): SubTaskChain[] {
  const sorted = sortChainSubTasks(items);
  const chains: SubTaskChain[] = [];
  let current: string[] = [];

  for (const item of sorted) {
    const startsNew =
      current.length === 0 || item.linkedToPrevious !== true;
    if (startsNew) {
      if (current.length > 0) {
        chains.push({
          headId: current[0]!,
          memberIds: current,
        });
      }
      current = [item.documentId];
      continue;
    }
    current.push(item.documentId);
  }

  if (current.length > 0) {
    chains.push({
      headId: current[0]!,
      memberIds: current,
    });
  }

  return chains;
}

export function findChainContaining(
  chains: readonly SubTaskChain[],
  documentId: string,
): SubTaskChain | null {
  return (
    chains.find((chain) => chain.memberIds.includes(documentId)) ?? null
  );
}

export function remainingExecutableMembers<T extends ChainSubTask>(
  chain: SubTaskChain,
  itemsById: Map<string, T>,
): T[] {
  return chain.memberIds
    .map((id) => itemsById.get(id))
    .filter((item): item is T => Boolean(item))
    .filter(
      (item) =>
        !isFinishedChainMember(item) && !isDisabledChainMember(item),
    );
}

export function isMultiMemberChain(chain: SubTaskChain): boolean {
  return chain.memberIds.length > 1;
}

/**
 * Intra-chain deps are ignored. Any unfinished dependency outside the
 * original chain blocks the whole group.
 */
export function chainHasExternalDependencyBlock(
  chainMemberIds: ReadonlySet<string>,
  membersToCheck: readonly Pick<ChainSubTask, "dependencyIds">[],
  siblingsById: Map<string, Pick<ChainSubTask, "status">>,
): boolean {
  for (const member of membersToCheck) {
    for (const depId of member.dependencyIds) {
      if (chainMemberIds.has(depId)) continue;
      const sibling = siblingsById.get(depId);
      if (sibling?.status !== FINISHED_STATUS) return true;
    }
  }
  return false;
}

export type AssigneeEditRole = "head" | "helper" | "none";

export function canEditAssignees(
  documentId: string,
  maxSameTimeWorkers: number,
  chain: SubTaskChain,
): AssigneeEditRole {
  if (documentId === chain.headId) return "head";
  if (maxSameTimeWorkers > 1) return "helper";
  return "none";
}

export function uniqueIds(ids: readonly string[]): string[] {
  return [...new Set(ids)];
}

/** Linking copies the previous row's assignees and discards the current set. */
export function assigneesAfterLinkToPrevious(
  previousAssignedToIds: readonly string[],
): string[] {
  return uniqueIds(previousAssignedToIds);
}

export type AssigneeMember = {
  documentId: string;
  assignedToIds: string[];
  maxSameTimeWorkers: number;
};

/**
 * Head set replaces every member. Extra helpers already on max>1 rows
 * (not in the previous head set) are kept.
 */
export function applyHeadAssigneePropagation(
  members: readonly AssigneeMember[],
  headId: string,
  previousHeadIds: readonly string[],
  nextHeadIds: readonly string[],
): Array<{ documentId: string; assignedToIds: string[] }> {
  const previousHead = new Set(previousHeadIds);
  const nextHead = uniqueIds(nextHeadIds);

  return members.map((member) => {
    if (member.documentId === headId) {
      return { documentId: member.documentId, assignedToIds: nextHead };
    }
    if (member.maxSameTimeWorkers > 1) {
      const extras = member.assignedToIds.filter((id) => !previousHead.has(id));
      return {
        documentId: member.documentId,
        assignedToIds: uniqueIds([...nextHead, ...extras]),
      };
    }
    return { documentId: member.documentId, assignedToIds: nextHead };
  });
}

export function previousChainMember<T extends { documentId: string }>(
  ordered: readonly T[],
  documentId: string,
): T | null {
  const index = ordered.findIndex((item) => item.documentId === documentId);
  if (index <= 0) return null;
  return ordered[index - 1] ?? null;
}

export type BoardChainSource = {
  documentId: string;
  index?: number;
  status: string;
  linkedToPrevious: boolean;
  maxSameTimeWorkers: number;
  assignedTo: readonly { documentId: string }[];
};

export function toChainSubTaskFromBoard(
  item: BoardChainSource,
  fallbackIndex: number,
): ChainSubTask {
  return {
    documentId: item.documentId,
    index: item.index ?? fallbackIndex,
    status: item.status,
    linkedToPrevious: item.linkedToPrevious,
    maxSameTimeWorkers: item.maxSameTimeWorkers,
    assignedToIds: item.assignedTo.map((assignee) => assignee.documentId),
    dependencyIds: [],
  };
}

export function chainItemsFromBoard(
  items: readonly BoardChainSource[],
): ChainSubTask[] {
  return items.map((item, index) => toChainSubTaskFromBoard(item, index));
}
