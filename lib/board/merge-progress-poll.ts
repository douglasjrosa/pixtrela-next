import type { KanbanTask } from "@/components/kanban/types";
import type { BoardProgressPollSnapshot } from "@/lib/board/progress-poll";
import { needsLiveBoardProgress } from "@/lib/business/task-progress";

function applyLayoutSnapshot(
  task: KanbanTask,
  snapshot: BoardProgressPollSnapshot,
): KanbanTask {
  const layout = snapshot.layoutByTaskId[task.documentId];
  if (!layout) return task;
  return {
    ...task,
    status: layout.status,
    stepId: layout.stepId,
    index: layout.index,
    name: layout.name,
    qty: layout.qty,
    deliveryDate: layout.deliveryDate,
    endedAt: layout.endedAt,
  };
}

/**
 * Merges a no-store progress poll into board task rows.
 * Layout fields, badge counts, and progress bars are refreshed from the snapshot.
 */
export function mergeBoardProgressPoll(
  tasks: readonly KanbanTask[],
  snapshot: BoardProgressPollSnapshot,
): KanbanTask[] {
  return tasks.map((task) => {
    const withLayout = applyLayoutSnapshot(task, snapshot);
    const badges = snapshot.badgesByTaskId[task.documentId];
    const withBadges: KanbanTask = badges
      ? {
          ...withLayout,
          activeColaboratorCount: badges.activeColaboratorCount,
          unassignedSubTaskCount: badges.unassignedSubTaskCount,
          participantCount: badges.participantCount,
        }
      : withLayout;

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
