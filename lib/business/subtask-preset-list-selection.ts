import type { SubTaskPreset } from "@/lib/business/subtask-preset";

import {
  areAllRowsSelected,
  areAllSelectedRowsInactive,
  selectedRowsFromList,
  toggleSelectAllRows,
} from "./list-selection";

export { toggleIdInSet } from "./list-selection";

export function areAllSubtaskPresetsSelected(
  presets: readonly SubTaskPreset[],
  selectedIds: readonly string[],
): boolean {
  return areAllRowsSelected(presets, selectedIds);
}

export function toggleSelectAllSubtaskPresets(
  presets: readonly SubTaskPreset[],
  selectedIds: readonly string[],
): string[] {
  return toggleSelectAllRows(presets, selectedIds);
}

export function selectedSubtaskPresetsFromList(
  presets: readonly SubTaskPreset[],
  selectedIds: readonly string[],
): SubTaskPreset[] {
  return selectedRowsFromList(presets, selectedIds);
}

export function areAllSelectedSubtaskPresetsArchived(
  selected: readonly SubTaskPreset[],
): boolean {
  return areAllSelectedRowsInactive(selected, (preset) => !preset.active);
}
