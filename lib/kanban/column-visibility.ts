export const KANBAN_COLUMN_INITIAL_VISIBLE_COUNT = 10;
export const KANBAN_COLUMN_LOAD_MORE_INCREMENT = 10;

export function sliceVisibleKanbanTasks<T>(
  tasks: T[],
  visibleCount: number,
): T[] {
  return tasks.slice(0, visibleCount);
}

export function kanbanColumnHasMore(
  tasksLength: number,
  visibleCount: number,
): boolean {
  return tasksLength > visibleCount;
}

export function nextKanbanColumnVisibleCount(
  current: number,
  tasksLength: number,
  increment: number = KANBAN_COLUMN_LOAD_MORE_INCREMENT,
): number {
  return Math.min(current + increment, tasksLength);
}
