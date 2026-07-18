import type { BoardSubTaskSummary } from "@/components/kanban/types";

const FINISHED_STATUS = "finished";

export function splitSubtasksByFinished(
  subtasks: readonly BoardSubTaskSummary[],
): {
  pending: BoardSubTaskSummary[];
  finished: BoardSubTaskSummary[];
} {
  const pending: BoardSubTaskSummary[] = [];
  const finished: BoardSubTaskSummary[] = [];

  for (const subtask of subtasks) {
    if (subtask.status === FINISHED_STATUS) {
      finished.push(subtask);
    } else {
      pending.push(subtask);
    }
  }

  return { pending, finished };
}

export function toggleCollaboratorOnSubtask(
  assignedIds: readonly string[],
  collaboratorId: string,
): string[] {
  if (assignedIds.includes(collaboratorId)) {
    return assignedIds.filter((id) => id !== collaboratorId);
  }
  return [...assignedIds, collaboratorId];
}

export function toggleTeamOnSubtask(
  assignedIds: readonly string[],
  teamMemberIds: readonly string[],
): string[] {
  if (teamMemberIds.length === 0) return [...assignedIds];

  const allSelected = teamMemberIds.every((id) => assignedIds.includes(id));
  if (allSelected) {
    return assignedIds.filter((id) => !teamMemberIds.includes(id));
  }

  return [...new Set([...assignedIds, ...teamMemberIds])];
}

export function isSubtaskAssignedTo(
  subtask: BoardSubTaskSummary,
  collaboratorId: string,
): boolean {
  return subtask.assignedTo.some(
    (assignee) => assignee.documentId === collaboratorId,
  );
}

export function subtasksAssignedToCollaborator(
  subtasks: readonly BoardSubTaskSummary[],
  collaboratorId: string,
): BoardSubTaskSummary[] {
  return subtasks.filter((subtask) =>
    isSubtaskAssignedTo(subtask, collaboratorId),
  );
}
