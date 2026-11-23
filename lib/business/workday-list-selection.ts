import type { WorkdayRow } from "@/components/workdays/types";

import {
  areAllRowsSelected,
  areAllSelectedRowsInactive,
  selectedRowsFromList,
  toggleSelectAllRows,
} from "./list-selection";

export { toggleIdInSet } from "./list-selection";

export function areAllWorkdaysSelected(
  workdays: readonly WorkdayRow[],
  selectedIds: readonly string[],
): boolean {
  return areAllRowsSelected(workdays, selectedIds);
}

export function toggleSelectAllWorkdays(
  workdays: readonly WorkdayRow[],
  selectedIds: readonly string[],
): string[] {
  return toggleSelectAllRows(workdays, selectedIds);
}

export function selectedWorkdaysFromList(
  workdays: readonly WorkdayRow[],
  selectedIds: readonly string[],
): WorkdayRow[] {
  return selectedRowsFromList(workdays, selectedIds);
}

export function areAllSelectedWorkdaysArchived(
  selected: readonly WorkdayRow[],
): boolean {
  return areAllSelectedRowsInactive(selected, (workday) => !workday.active);
}
