import type { TaskRow } from "@/components/tasks/types";

export function toggleIdInSet(
  ids: readonly string[],
  id: string,
): string[] {
  if (ids.includes(id)) {
    return ids.filter((value) => value !== id);
  }
  return [...ids, id];
}

export function areAllTasksSelected(
  tasks: readonly TaskRow[],
  selectedIds: readonly string[],
): boolean {
  if (tasks.length === 0) return false;
  return tasks.every((task) => selectedIds.includes(task.documentId));
}

export function toggleSelectAllTasks(
  tasks: readonly TaskRow[],
  selectedIds: readonly string[],
): string[] {
  if (areAllTasksSelected(tasks, selectedIds)) {
    const visibleIds = new Set(tasks.map((task) => task.documentId));
    return selectedIds.filter((id) => !visibleIds.has(id));
  }
  const merged = new Set(selectedIds);
  for (const task of tasks) {
    merged.add(task.documentId);
  }
  return [...merged];
}

export function selectedTasksFromList(
  tasks: readonly TaskRow[],
  selectedIds: readonly string[],
): TaskRow[] {
  const idSet = new Set(selectedIds);
  return tasks.filter((task) => idSet.has(task.documentId));
}

export function areAllSelectedTasksArchived(
  selected: readonly TaskRow[],
): boolean {
  if (selected.length === 0) return false;
  return selected.every((task) => !task.active);
}
