export function assertFinishFlagsAllowed(input: {
  willFinish: boolean;
  hasDependents: boolean;
  categoryId: string | null | undefined;
  totalFlagCount: number;
  availableCount: number;
  inferred?: boolean;
  semBandeira?: boolean;
}): void {
  if (!input.willFinish || !input.hasDependents) return;
  if (input.inferred === true || input.semBandeira === true) return;
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

/** Prefer stored category; otherwise first selected flag category. */
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

/**
 * Resolves the category to use when assigning flags. Adopts the selected flag
 * category when the stored category is stale and no conflicting flags exist yet.
 */
export function resolveSubTaskFlagCategory(input: {
  storedCategoryId: string | null;
  selectedFlagCategoryIds: readonly string[];
  existingFlagCategoryIds: readonly string[];
}): string | null {
  const selected = [
    ...new Set(
      input.selectedFlagCategoryIds.filter((id) => id.trim().length > 0),
    ),
  ];
  if (selected.length !== 1) return null;
  const flagCategory = selected[0]!;

  if (!input.storedCategoryId) return flagCategory;
  if (input.storedCategoryId === flagCategory) return flagCategory;

  const existing = [
    ...new Set(
      input.existingFlagCategoryIds.filter((id) => id.trim().length > 0),
    ),
  ];
  if (existing.length === 0) return flagCategory;
  if (existing.length === 1 && existing[0] === flagCategory) return flagCategory;

  return null;
}
