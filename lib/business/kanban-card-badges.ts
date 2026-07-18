import type { ActivitySessionRef } from "@/lib/business/task-progress";

export type UnassignedSubTaskInput = {
  assignedCount: number;
};

/**
 * Unique colaborators with at least one open started session on the task.
 */
export function countOpenColaborators(
  activities: readonly ActivitySessionRef[],
): number {
  const sorted = [...activities].sort((left, right) =>
    left.timestamp.localeCompare(right.timestamp),
  );
  const openBySession = new Map<string, string>();

  for (const activity of sorted) {
    const key = `${activity.subTaskDocumentId}:${activity.colaboratorDocumentId}`;
    if (activity.action === "started") {
      openBySession.set(key, activity.colaboratorDocumentId);
      continue;
    }
    openBySession.delete(key);
  }

  return new Set(openBySession.values()).size;
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
