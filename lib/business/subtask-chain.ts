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

/**
 * Helpers may add or drop extras, but every head assignee must remain.
 */
export function constrainHelperAssignees(
  headAssignedToIds: readonly string[],
  nextAssignedToIds: readonly string[],
): string[] {
  const headIds = uniqueIds(headAssignedToIds);
  const extras = uniqueIds(nextAssignedToIds).filter(
    (id) => !headIds.includes(id),
  );
  return uniqueIds([...headIds, ...extras]);
}

export type ChainClickScope = "self" | "group";

export type ChainClickSelection = {
  selectedId: string;
  scope: ChainClickScope;
};

export type AssigneeApplyScope = ChainClickScope;

/**
 * Clicking max=1 selects the whole chain. Clicking max>1 starts on that row
 * only; a later click on the same row toggles self/group.
 */
export function nextChainSubtaskClick(input: {
  clickedId: string;
  clickedMaxWorkers: number;
  current: ChainClickSelection | null;
}): ChainClickSelection | null {
  const { clickedId, clickedMaxWorkers, current } = input;
  if (clickedMaxWorkers <= 1) {
    if (current?.selectedId === clickedId && current.scope === "group") {
      return null;
    }
    return { selectedId: clickedId, scope: "group" };
  }
  if (current?.selectedId === clickedId) {
    return {
      selectedId: clickedId,
      scope: current.scope === "self" ? "group" : "self",
    };
  }
  return { selectedId: clickedId, scope: "self" };
}

export function chainIdsForClickSelection(
  chains: readonly SubTaskChain[],
  selection: ChainClickSelection | null,
): string[] {
  if (!selection) return [];
  if (selection.scope === "self") return [selection.selectedId];
  const chain = findChainContaining(chains, selection.selectedId);
  if (!chain || !isMultiMemberChain(chain)) return [selection.selectedId];
  return [...chain.memberIds];
}

export function sameAssigneeIdSet(
  left: readonly string[],
  right: readonly string[],
): boolean {
  const uniqueLeft = uniqueIds(left);
  const uniqueRight = uniqueIds(right);
  if (uniqueLeft.length !== uniqueRight.length) return false;
  const rightSet = new Set(uniqueRight);
  return uniqueLeft.every((id) => rightSet.has(id));
}

/** Head save may cascade only when every member already matches the new set. */
export function shouldPropagateHeadAssigneeSave(
  memberAssignedToIds: readonly (readonly string[])[],
  nextHeadIds: readonly string[],
): boolean {
  return memberAssignedToIds.every((ids) =>
    sameAssigneeIdSet(ids, nextHeadIds),
  );
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
 * Head set replaces every member, including extras on max>1 rows.
 */
export function applyHeadAssigneePropagation(
  members: readonly AssigneeMember[],
  _headId: string,
  nextHeadIds: readonly string[],
): Array<{ documentId: string; assignedToIds: string[] }> {
  const nextHead = uniqueIds(nextHeadIds);
  return members.map((member) => ({
    documentId: member.documentId,
    assignedToIds: nextHead,
  }));
}

export type ChainAssigneeState = {
  documentId: string;
  linkedToPrevious: boolean;
  maxSameTimeWorkers: number;
  assignedToIds: string[];
};

function cloneChainAssigneeState(
  items: readonly ChainAssigneeState[],
): ChainAssigneeState[] {
  return items.map((item) => ({
    ...item,
    assignedToIds: [...item.assignedToIds],
  }));
}

function chainItemsFromAssigneeState(
  items: readonly ChainAssigneeState[],
): ChainSubTask[] {
  return items.map((item, index) => ({
    documentId: item.documentId,
    index,
    status: "waiting",
    linkedToPrevious: item.linkedToPrevious,
    maxSameTimeWorkers: item.maxSameTimeWorkers,
    assignedToIds: item.assignedToIds,
    dependencyIds: [],
  }));
}

function inheritHeadAssignees(
  items: ChainAssigneeState[],
  chain: SubTaskChain,
): void {
  const head = items.find((item) => item.documentId === chain.headId);
  if (!head) return;
  const headIds = uniqueIds(head.assignedToIds);
  for (const memberId of chain.memberIds) {
    if (memberId === chain.headId) continue;
    const member = items.find((item) => item.documentId === memberId);
    if (member) member.assignedToIds = [...headIds];
  }
}

/**
 * Link copies the resulting head's assignees onto this row and every later
 * member. Unlink only clears the flag; assignees stay.
 */
export function applyChainLinkToggle(
  ordered: readonly ChainAssigneeState[],
  documentId: string,
  linkedToPrevious: boolean,
): ChainAssigneeState[] {
  const next = cloneChainAssigneeState(ordered);
  const current = next.find((item) => item.documentId === documentId);
  if (!current) return next;
  if (linkedToPrevious && previousChainMember(next, documentId) == null) {
    return next;
  }

  current.linkedToPrevious = linkedToPrevious;
  if (!linkedToPrevious) return next;

  const chain = findChainContaining(
    resolveChains(chainItemsFromAssigneeState(next)),
    documentId,
  );
  if (!chain || !isMultiMemberChain(chain)) return next;
  inheritHeadAssignees(next, chain);
  return next;
}

function setGroupLinks(
  items: ChainAssigneeState[],
  memberIds: readonly string[],
  headId: string,
): void {
  const members = new Set(memberIds);
  for (const item of items) {
    if (!members.has(item.documentId)) continue;
    item.linkedToPrevious = item.documentId !== headId;
  }
}

/**
 * Recomputes links after a single-row drag. Assignees stay unless a row
 * joins a group, in which case it inherits the head set.
 */
export function reconcileChainReorder(
  ordered: readonly ChainAssigneeState[],
  newOrderIds: readonly string[],
  movedId: string,
): ChainAssigneeState[] {
  const byId = new Map(
    cloneChainAssigneeState(ordered).map((item) => [item.documentId, item]),
  );
  const next = newOrderIds
    .map((id) => byId.get(id))
    .filter((item): item is ChainAssigneeState => Boolean(item));
  if (next.length === 0) return [];

  const oldChains = resolveChains(chainItemsFromAssigneeState(ordered));
  const movedChain = findChainContaining(oldChains, movedId);
  const movedPos = next.findIndex((item) => item.documentId === movedId);

  if (movedChain && isMultiMemberChain(movedChain)) {
    const remainingIds = movedChain.memberIds.filter((id) => id !== movedId);
    const remainingPos = remainingIds
      .map((id) => next.findIndex((item) => item.documentId === id))
      .filter((index) => index >= 0)
      .sort((left, right) => left - right);
    const firstRem = remainingPos[0];
    const lastRem = remainingPos[remainingPos.length - 1];
    const inside =
      remainingPos.length > 0 &&
      movedPos > firstRem! &&
      movedPos < lastRem!;
    const newHeadId =
      movedChain.headId === movedId
        ? remainingIds[0] ?? movedId
        : movedChain.headId;
    const members = inside ? [...remainingIds, movedId] : remainingIds;
    if (members.length > 0) {
      setGroupLinks(next, members, newHeadId);
    }
    if (!inside) {
      const moved = next[movedPos];
      if (moved) moved.linkedToPrevious = false;
    }
  }

  for (const chain of oldChains) {
    if (!isMultiMemberChain(chain)) continue;
    if (chain.memberIds.includes(movedId)) continue;
    const memberPos = chain.memberIds
      .map((id) => next.findIndex((item) => item.documentId === id))
      .filter((index) => index >= 0)
      .sort((left, right) => left - right);
    const first = memberPos[0];
    const last = memberPos[memberPos.length - 1];
    if (
      first === undefined ||
      last === undefined ||
      movedPos <= first ||
      movedPos >= last
    ) {
      continue;
    }
    const head = next.find((item) => item.documentId === chain.headId);
    const moved = next[movedPos];
    if (head && moved) {
      moved.assignedToIds = uniqueIds(head.assignedToIds);
    }
    setGroupLinks(next, [...chain.memberIds, movedId], chain.headId);
  }

  if (next[0]) next[0].linkedToPrevious = false;
  return next;
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
    index: fallbackIndex,
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

export function chainAssigneeStateFromBoard(
  items: readonly BoardChainSource[],
): ChainAssigneeState[] {
  return items.map((item) => ({
    documentId: item.documentId,
    linkedToPrevious: item.linkedToPrevious,
    maxSameTimeWorkers: item.maxSameTimeWorkers,
    assignedToIds: item.assignedTo.map((assignee) => assignee.documentId),
  }));
}
