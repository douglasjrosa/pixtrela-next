import type { AwardRow } from "@/components/awards/types";

import {
  areAllRowsSelected,
  areAllSelectedRowsInactive,
  selectedRowsFromList,
  toggleSelectAllRows,
} from "./list-selection";

export { toggleIdInSet } from "./list-selection";

export function areAllAwardsSelected(
  awards: readonly AwardRow[],
  selectedIds: readonly string[],
): boolean {
  return areAllRowsSelected(awards, selectedIds);
}

export function toggleSelectAllAwards(
  awards: readonly AwardRow[],
  selectedIds: readonly string[],
): string[] {
  return toggleSelectAllRows(awards, selectedIds);
}

export function selectedAwardsFromList(
  awards: readonly AwardRow[],
  selectedIds: readonly string[],
): AwardRow[] {
  return selectedRowsFromList(awards, selectedIds);
}

export function areAllSelectedAwardsArchived(
  selected: readonly AwardRow[],
): boolean {
  return areAllSelectedRowsInactive(selected, (award) => !award.active);
}
