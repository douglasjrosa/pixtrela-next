import type { TaskRow } from "@/components/tasks/types";

import {
  areAllRowsSelected,
  areAllSelectedRowsInactive,
  selectedRowsFromList,
  toggleSelectAllRows,
} from "./list-selection";

export { toggleIdInSet } from "./list-selection";

export function areAllTasksSelected(
  tasks: readonly TaskRow[],
  selectedIds: readonly string[],
): boolean {
  return areAllRowsSelected(tasks, selectedIds);
}

export function toggleSelectAllTasks(
  tasks: readonly TaskRow[],
  selectedIds: readonly string[],
): string[] {
  return toggleSelectAllRows(tasks, selectedIds);
}

export function selectedTasksFromList(
  tasks: readonly TaskRow[],
  selectedIds: readonly string[],
): TaskRow[] {
  return selectedRowsFromList(tasks, selectedIds);
}

export function areAllSelectedTasksArchived(
  selected: readonly TaskRow[],
): boolean {
  return areAllSelectedRowsInactive(selected, (task) => !task.active);
}
