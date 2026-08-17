import type { TeamRow } from "@/components/teams/types";

export { toggleIdInSet } from "./template-list-selection";

export function areAllTeamsSelected(
  teams: readonly TeamRow[],
  selectedIds: readonly string[],
): boolean {
  if (teams.length === 0) return false;
  return teams.every((team) => selectedIds.includes(team.documentId));
}

export function toggleSelectAllTeams(
  teams: readonly TeamRow[],
  selectedIds: readonly string[],
): string[] {
  if (areAllTeamsSelected(teams, selectedIds)) {
    const visibleIds = new Set(teams.map((team) => team.documentId));
    return selectedIds.filter((id) => !visibleIds.has(id));
  }
  const merged = new Set(selectedIds);
  for (const team of teams) {
    merged.add(team.documentId);
  }
  return [...merged];
}

export function selectedTeamsFromList(
  teams: readonly TeamRow[],
  selectedIds: readonly string[],
): TeamRow[] {
  const idSet = new Set(selectedIds);
  return teams.filter((team) => idSet.has(team.documentId));
}

export function areAllSelectedTeamsArchived(
  selected: readonly TeamRow[],
): boolean {
  if (selected.length === 0) return false;
  return selected.every((team) => !team.active);
}
