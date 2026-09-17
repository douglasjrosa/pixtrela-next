import type { DependencyFlagHint } from "@/lib/business/subtask-queue";
import { isSemBandeiraHint } from "@/lib/business/subtask-material-flags";

export type DependencyPredecessorSnapshot = {
  name: string;
  status: string;
  subTaskCategoryId?: string | null;
};

export function buildDependencyFlagHintsForItem(
  dependencyIds: readonly string[],
  predecessorsById: ReadonlyMap<string, DependencyPredecessorSnapshot>,
  codesBySubTaskId: ReadonlyMap<string, readonly string[]>,
  flagsBySubTaskId: ReadonlyMap<
    string,
    ReadonlyArray<{ id: string; code: string }>
  >,
): DependencyFlagHint[] {
  return dependencyIds
    .map((depId) => {
      const predecessor = predecessorsById.get(depId);
      const codes = [...(codesBySubTaskId.get(depId) ?? [])];
      const flags = [...(flagsBySubTaskId.get(depId) ?? [])];
      const semBandeira = isSemBandeiraHint({
        categoryId: predecessor?.subTaskCategoryId ?? null,
        status: predecessor?.status,
        assignedFlagCodes: codes,
      });
      if (!semBandeira && codes.length === 0) return null;
      return {
        predecessorId: depId,
        predecessorName: predecessor?.name ?? "",
        codes,
        flags,
        semBandeira,
      };
    })
    .filter((hint): hint is NonNullable<typeof hint> => Boolean(hint));
}
