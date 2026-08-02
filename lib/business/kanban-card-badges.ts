import {
  listOpenColaboratorDocumentIds,
  type ActivitySessionRef,
} from "@/lib/business/task-progress";

export type UnassignedSubTaskInput = {
  assignedCount: number;
};

/**
 * Unique colaborators with at least one open started session on the task.
 */
export function countOpenColaborators(
  activities: readonly ActivitySessionRef[],
): number {
  return listOpenColaboratorDocumentIds(activities).length;
}

/** Unique colaborators who appear in any activity on the task. */
export function countUniqueColaboratorIds(
  colaboratorDocumentIds: readonly string[],
): number {
  return new Set(colaboratorDocumentIds).size;
}

/** Sub-tasks with zero assignees (already filtered by caller). */
export function countUnassignedSubTasks(
  subTasks: readonly UnassignedSubTaskInput[],
): number {
  let total = 0;
  for (const subTask of subTasks) {
    if (subTask.assignedCount === 0) total += 1;
  }
  return total;
}
