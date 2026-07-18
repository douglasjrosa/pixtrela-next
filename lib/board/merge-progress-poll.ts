import type { KanbanTask } from "@/components/kanban/types";
import type { BoardProgressPollSnapshot } from "@/lib/board/progress-poll";
import { needsLiveBoardProgress } from "@/lib/business/task-progress";

/**
 * Merges a no-store progress poll into board task rows.
 * Badge counts apply to every task in the snapshot (including waiting).
 * Progress bar fields apply only to live tasks with expected time.
 */
export function mergeBoardProgressPoll(
  tasks: readonly KanbanTask[],
  snapshot: BoardProgressPollSnapshot,
): KanbanTask[] {
  return tasks.map((task) => {
    const badges = snapshot.badgesByTaskId[task.documentId];
    const withBadges: KanbanTask = badges
      ? {
          ...task,
          activeColaboratorCount: badges.activeColaboratorCount,
          unassignedSubTaskCount: badges.unassignedSubTaskCount,
        }
      : task;

    if (
      !needsLiveBoardProgress(withBadges.status) ||
      withBadges.totalExpectedTime <= 0
    ) {
      return withBadges;
    }

    const progress = snapshot.progressByTaskId[task.documentId];
    const totals = snapshot.totalsByTaskId[task.documentId];
    return {
      ...withBadges,
      progressPending: false,
      progressInput: progress ??
        withBadges.progressInput ?? {
          subTasks: [],
          openActivityStartedAts: [],
        },
      totalTimeSpent: totals?.totalTimeSpent ?? withBadges.totalTimeSpent,
      totalExpectedTime: totals?.totalExpectedTime ?? withBadges.totalExpectedTime,
      progressNowMs: snapshot.nowMs,
    };
  });
}
