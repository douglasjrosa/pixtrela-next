import {
  findChainContaining,
  resolveChains,
  type ChainSubTask,
  type SubTaskChain,
} from "@/lib/business/subtask-chain";

const FINISHED_STATUS = "finished";

export type SkipFinishPartition = {
  allowedIds: string[];
  blocked: Array<{
    memberIds: string[];
    openUserIds: string[];
  }>;
};

export function expandSkipToChains(
  items: readonly ChainSubTask[],
  selectedIds: readonly string[],
): string[] {
  const selected = new Set(selectedIds);
  if (selected.size === 0) return [];
  const chains = resolveChains(items);
  const expanded = new Set<string>();
  for (const id of selected) {
    const chain = findChainContaining(chains, id);
    if (!chain) {
      expanded.add(id);
      continue;
    }
    for (const memberId of chain.memberIds) expanded.add(memberId);
  }
  return [...expanded];
}

export function partitionSkipByOpenSessions(
  chains: readonly Pick<SubTaskChain, "memberIds">[],
  openUserIdsBySubTaskId: ReadonlyMap<string, readonly string[]>,
): SkipFinishPartition {
  const allowedIds: string[] = [];
  const blocked: SkipFinishPartition["blocked"] = [];

  for (const chain of chains) {
    const openUserIds = uniqueIds(
      chain.memberIds.flatMap(
        (id) => openUserIdsBySubTaskId.get(id) ?? [],
      ),
    );
    if (openUserIds.length > 0) {
      blocked.push({
        memberIds: [...chain.memberIds],
        openUserIds,
      });
      continue;
    }
    allowedIds.push(...chain.memberIds);
  }

  return { allowedIds, blocked };
}

export function eligibleSkipFinishIds(
  items: readonly Pick<ChainSubTask, "documentId" | "status">[],
  candidateIds: readonly string[],
): string[] {
  const statusById = new Map(
    items.map((item) => [item.documentId, item.status]),
  );
  return candidateIds.filter((id) => statusById.get(id) !== FINISHED_STATUS);
}

export function isSkipFinishDraftActive(
  skipDraftIds: readonly string[],
  selectedIds: readonly string[],
): boolean {
  if (skipDraftIds.length === 0) return false;
  if (selectedIds.length === 0) return true;
  const skip = new Set(skipDraftIds);
  return selectedIds.every((id) => skip.has(id));
}

export function applySkipFinishDraft<T extends { documentId: string }>(
  items: readonly T[],
  skipIds: ReadonlySet<string>,
  patch: Partial<Omit<T, "documentId">>,
): T[] {
  return items.map((item) =>
    skipIds.has(item.documentId) ? { ...item, ...patch } : item,
  );
}

export function uniqueSortedNames(names: readonly string[]): string[] {
  return [...new Set(names.filter(Boolean))].sort((left, right) =>
    left.localeCompare(right, "pt-BR"),
  );
}

function uniqueIds(ids: readonly string[]): string[] {
  return [...new Set(ids)];
}
