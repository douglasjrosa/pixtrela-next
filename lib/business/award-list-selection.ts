import type { AwardRow } from "@/components/awards/types";

export { toggleIdInSet } from "./template-list-selection";

export function areAllAwardsSelected(
  awards: readonly AwardRow[],
  selectedIds: readonly string[],
): boolean {
  if (awards.length === 0) return false;
  return awards.every((award) => selectedIds.includes(award.documentId));
}

export function toggleSelectAllAwards(
  awards: readonly AwardRow[],
  selectedIds: readonly string[],
): string[] {
  if (areAllAwardsSelected(awards, selectedIds)) {
    const visibleIds = new Set(awards.map((award) => award.documentId));
    return selectedIds.filter((id) => !visibleIds.has(id));
  }
  const merged = new Set(selectedIds);
  for (const award of awards) {
    merged.add(award.documentId);
  }
  return [...merged];
}

export function selectedAwardsFromList(
  awards: readonly AwardRow[],
  selectedIds: readonly string[],
): AwardRow[] {
  const idSet = new Set(selectedIds);
  return awards.filter((award) => idSet.has(award.documentId));
}

export function areAllSelectedAwardsArchived(
  selected: readonly AwardRow[],
): boolean {
  if (selected.length === 0) return false;
  return selected.every((award) => !award.active);
}
