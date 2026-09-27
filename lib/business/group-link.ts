import type { BoardSubTaskSummary } from "@/components/kanban/types";

import {
  chainItemsFromBoard,
  isMultiMemberChain,
  resolveChains,
} from "@/lib/business/subtask-chain";

const MIN_SAME_TIME_WORKERS = 1;

export type SharingType = "qty" | "duration";

export type IndexedSharingRow = {
  documentId: string;
  index: number;
  sharingType: SharingType;
  linkedToPrevious: boolean;
};

export function previousByIndex<T extends { index: number }>(
  current: T,
  items: readonly T[],
): T | null {
  let previous: T | null = null;
  for (const item of items) {
    if (item.index >= current.index) continue;
    if (!previous || item.index > previous.index) previous = item;
  }
  return previous;
}

export function showChainLinkButton(
  current: IndexedSharingRow,
  items: readonly IndexedSharingRow[],
): boolean {
  const previous = previousByIndex(current, items);
  if (!previous) return false;
  return current.sharingType === previous.sharingType;
}

export function effectiveLinkedToPrevious(
  current: IndexedSharingRow,
  previous: IndexedSharingRow | null,
): boolean {
  if (!current.linkedToPrevious || !previous) return false;
  return current.sharingType === previous.sharingType;
}

export function applyEffectiveBoardLinks<T extends IndexedSharingRow>(
  items: readonly T[],
): T[] {
  const ordered = [...items].sort((left, right) => left.index - right.index);
  return ordered.map((item) => {
    const previous = previousByIndex(item, ordered);
    return {
      ...item,
      linkedToPrevious: effectiveLinkedToPrevious(item, previous),
    };
  });
}

export function displayMaxSameTimeWorkers(
  items: readonly (IndexedSharingRow & { maxSameTimeWorkers: number })[],
): Map<string, number> {
  const effective = applyEffectiveBoardLinks(items);
  const chains = resolveChains(
    chainItemsFromBoard(
      effective.map((item) => ({
        documentId: item.documentId,
        index: item.index,
        status: "waiting",
        linkedToPrevious: item.linkedToPrevious,
        maxSameTimeWorkers: item.maxSameTimeWorkers,
        assignedTo: [],
      })),
    ),
  );
  const maxById = new Map<string, number>();
  for (const item of effective) {
    maxById.set(item.documentId, item.maxSameTimeWorkers);
  }
  for (const chain of chains) {
    if (!isMultiMemberChain(chain)) continue;
    const members = effective.filter((item) =>
      chain.memberIds.includes(item.documentId),
    );
    const capacity = members.reduce(
      (max, item) => Math.max(max, item.maxSameTimeWorkers),
      MIN_SAME_TIME_WORKERS,
    );
    for (const memberId of chain.memberIds) {
      maxById.set(memberId, capacity);
    }
  }
  return maxById;
}

export function groupMemberIds(
  items: readonly IndexedSharingRow[],
  documentId: string,
): string[] {
  const effective = applyEffectiveBoardLinks(items);
  const chains = resolveChains(
    chainItemsFromBoard(
      effective.map((item) => ({
        documentId: item.documentId,
        status: "waiting",
        linkedToPrevious: item.linkedToPrevious,
        maxSameTimeWorkers: MIN_SAME_TIME_WORKERS,
        assignedTo: [],
      })),
    ),
  );
  const chain = chains.find((item) => item.memberIds.includes(documentId));
  if (!chain || !isMultiMemberChain(chain)) return [documentId];
  return [...chain.memberIds];
}

export function toggleGroupInSelection(
  selectedIds: readonly string[],
  memberIds: readonly string[],
): string[] {
  const selected = new Set(selectedIds);
  const allSelected = memberIds.every((id) => selected.has(id));
  if (allSelected) {
    return selectedIds.filter((id) => !memberIds.includes(id));
  }
  return [...new Set([...selectedIds, ...memberIds])];
}

export function formatQueueGroupLabel(headName: string, otherCount: number): string {
  if (otherCount <= 0) return headName;
  return `${headName} +${otherCount}`;
}

export function prepareBoardSubtasksForSave(
  subtasks: readonly BoardSubTaskSummary[],
): BoardSubTaskSummary[] {
  const effective = applyEffectiveBoardLinks(subtasks);
  const chains = resolveChains(chainItemsFromBoard(effective));
  const assigneesById = new Map(
    effective.map((item) => [item.documentId, item.assignedTo]),
  );
  for (const chain of chains) {
    if (!isMultiMemberChain(chain)) continue;
    const head = effective.find((item) => item.documentId === chain.headId);
    if (!head) continue;
    for (const memberId of chain.memberIds) {
      assigneesById.set(memberId, head.assignedTo);
    }
  }
  return effective.map((item) => ({
    ...item,
    assignedTo: assigneesById.get(item.documentId) ?? item.assignedTo,
  }));
}
