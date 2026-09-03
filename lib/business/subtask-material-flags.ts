export function assertFinishFlagsAllowed(input: {
  willFinish: boolean;
  hasDependents: boolean;
  categoryId: string | null | undefined;
  totalFlagCount: number;
  availableCount: number;
}): void {
  if (!input.willFinish || !input.hasDependents) return;
  if (!input.categoryId) return;
  if (input.availableCount <= 0) return;
  if (input.totalFlagCount < 1) throw new Error("flagsRequired");
}

/** UI/server gate: whether finish confirm is allowed regarding flags. */
export function canConfirmFinishWithFlags(input: {
  willFinish: boolean;
  hasDependents: boolean;
  categoryId: string | null | undefined;
  selectedFlagCount: number;
  availableFlagCount: number;
  semBandeiraSelected: boolean;
}): boolean {
  if (!input.willFinish || !input.hasDependents) return true;
  if (!input.categoryId) return true;
  if (input.availableFlagCount > 0) return input.selectedFlagCount >= 1;
  return input.semBandeiraSelected;
}

/** Consumer card hint: predecessor has no material flag to locate. */
export function isSemBandeiraHint(predecessor: {
  categoryId?: string | null;
  status?: string;
  assignedFlagCodes?: readonly string[];
}): boolean {
  if (!predecessor.categoryId) return true;
  const codes = predecessor.assignedFlagCodes ?? [];
  return predecessor.status === "finished" && codes.length === 0;
}

export function mergeFlagIds(
  existing: readonly string[],
  next: readonly string[],
): string[] {
  return [...new Set([...existing, ...next].filter((id) => id.length > 0))];
}

/** Prefer stored category; otherwise first flag category (assign validation only). */
export function resolveCategoryIdFromFlagCategories(
  categoryId: string | null | undefined,
  flagCategoryIds: readonly string[],
): string | null {
  if (categoryId) return categoryId;
  const unique = [
    ...new Set(flagCategoryIds.filter((id) => id.trim().length > 0)),
  ];
  if (unique.length === 0) return null;
  return unique[0]!;
}
