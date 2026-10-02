import {
  isMultiMemberChain,
  resolveChainsByTask,
  type ChainSubTask,
} from "@/lib/business/subtask-chain";

export type CatalogChainLookupItem = ChainSubTask & {
  taskDocumentId: string;
};

export type OpenRunLookupGroup = {
  headId: string;
  memberIds: readonly string[];
};

/** Per-task multi-member chains used to attach live group runs. */
export function openRunLookupGroupsFromCatalog(
  catalog: readonly CatalogChainLookupItem[],
): OpenRunLookupGroup[] {
  return resolveChainsByTask(catalog)
    .filter(isMultiMemberChain)
    .map((chain) => ({
      headId: chain.headId,
      memberIds: chain.memberIds,
    }));
}
