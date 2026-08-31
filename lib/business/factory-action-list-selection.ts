import type { FactoryAction } from "@/lib/business/factory-action";

import {
  areAllRowsSelected,
  areAllSelectedRowsInactive,
  selectedRowsFromList,
  toggleSelectAllRows,
} from "./list-selection";

export { toggleIdInSet } from "./list-selection";

export function areAllFactoryActionsSelected(
  actions: readonly FactoryAction[],
  selectedIds: readonly string[],
): boolean {
  return areAllRowsSelected(actions, selectedIds);
}

export function toggleSelectAllFactoryActions(
  actions: readonly FactoryAction[],
  selectedIds: readonly string[],
): string[] {
  return toggleSelectAllRows(actions, selectedIds);
}

export function selectedFactoryActionsFromList(
  actions: readonly FactoryAction[],
  selectedIds: readonly string[],
): FactoryAction[] {
  return selectedRowsFromList(actions, selectedIds);
}

export function areAllSelectedFactoryActionsArchived(
  selected: readonly FactoryAction[],
): boolean {
  return areAllSelectedRowsInactive(selected, (action) => !action.active);
}
