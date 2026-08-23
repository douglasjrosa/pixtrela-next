import type { TeamRow } from "@/components/teams/types";

import {
  areAllRowsSelected,
  areAllSelectedRowsInactive,
  selectedRowsFromList,
  toggleSelectAllRows,
} from "./list-selection";

export { toggleIdInSet } from "./list-selection";

export function areAllTeamsSelected(
  teams: readonly TeamRow[],
  selectedIds: readonly string[],
): boolean {
  return areAllRowsSelected(teams, selectedIds);
}

export function toggleSelectAllTeams(
  teams: readonly TeamRow[],
  selectedIds: readonly string[],
): string[] {
  return toggleSelectAllRows(teams, selectedIds);
}

export function selectedTeamsFromList(
  teams: readonly TeamRow[],
  selectedIds: readonly string[],
): TeamRow[] {
  return selectedRowsFromList(teams, selectedIds);
}

export function areAllSelectedTeamsArchived(
  selected: readonly TeamRow[],
): boolean {
  return areAllSelectedRowsInactive(selected, (team) => !team.active);
}
