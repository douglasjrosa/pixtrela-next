import type { BoardSubTaskSummary } from "@/components/kanban/types";
import { getSubtaskAssigneeIds } from "@/lib/business/board-assignee-draft";

export type MultiAssignUpdate = {
  documentId: string;
  assignedToIds: string[];
};

export function toggleIdInSet(
  ids: readonly string[],
  id: string,
): string[] {
  if (ids.includes(id)) {
    return ids.filter((value) => value !== id);
  }
  return [...ids, id];
}

/**
 * Team shortcut for multi selection: if every member is selected, remove all;
 * otherwise add all members.
 */
export function toggleTeamMembersInSelection(
  selectedIds: readonly string[],
  memberIds: readonly string[],
): string[] {
  if (memberIds.length === 0) return [...selectedIds];

  const allSelected = memberIds.every((id) => selectedIds.includes(id));
  if (allSelected) {
    return selectedIds.filter((id) => !memberIds.includes(id));
  }
  return [...new Set([...selectedIds, ...memberIds])];
}

export function canApplyMultiAssign(
  subtaskIds: readonly string[],
  collaboratorIds: readonly string[],
): boolean {
  return subtaskIds.length > 0 && collaboratorIds.length > 0;
}

/** Adds selected collaborators that are not yet assigned. */
export function applyMultiAssignToSubtask(
  currentAssigneeIds: readonly string[],
  selectedCollaboratorIds: readonly string[],
): string[] {
  return [...new Set([...currentAssigneeIds, ...selectedCollaboratorIds])];
}

/** Removes selected collaborators that are currently assigned. */
export function applyMultiRemoveFromSubtask(
  currentAssigneeIds: readonly string[],
  selectedCollaboratorIds: readonly string[],
): string[] {
  const removeSet = new Set(selectedCollaboratorIds);
  return currentAssigneeIds.filter((id) => !removeSet.has(id));
}

function sameIds(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((id) => rightSet.has(id));
}

export function buildMultiAssignUpdates(
  subtasks: readonly BoardSubTaskSummary[],
  selectedSubtaskIds: readonly string[],
  selectedCollaboratorIds: readonly string[],
): MultiAssignUpdate[] {
  if (!canApplyMultiAssign(selectedSubtaskIds, selectedCollaboratorIds)) {
    return [];
  }

  const selected = new Set(selectedSubtaskIds);
  const updates: MultiAssignUpdate[] = [];

  for (const subtask of subtasks) {
    if (!selected.has(subtask.documentId)) continue;
    const current = getSubtaskAssigneeIds(subtask);
    const next = applyMultiAssignToSubtask(current, selectedCollaboratorIds);
    if (sameIds(current, next)) continue;
    updates.push({ documentId: subtask.documentId, assignedToIds: next });
  }

  return updates;
}

export function buildMultiRemoveUpdates(
  subtasks: readonly BoardSubTaskSummary[],
  selectedSubtaskIds: readonly string[],
  selectedCollaboratorIds: readonly string[],
): MultiAssignUpdate[] {
  if (!canApplyMultiAssign(selectedSubtaskIds, selectedCollaboratorIds)) {
    return [];
  }

  const selected = new Set(selectedSubtaskIds);
  const updates: MultiAssignUpdate[] = [];

  for (const subtask of subtasks) {
    if (!selected.has(subtask.documentId)) continue;
    const current = getSubtaskAssigneeIds(subtask);
    const next = applyMultiRemoveFromSubtask(current, selectedCollaboratorIds);
    if (sameIds(current, next)) continue;
    updates.push({ documentId: subtask.documentId, assignedToIds: next });
  }

  return updates;
}

export function countMultiSelection(
  subtaskIds: readonly string[],
  collaboratorIds: readonly string[],
): { subtaskCount: number; collaboratorCount: number } {
  return {
    subtaskCount: subtaskIds.length,
    collaboratorCount: collaboratorIds.length,
  };
}

export function isMultiSelectionDirty(
  multiEnabled: boolean,
  selectedSubtaskIds: readonly string[],
  selectedCollaboratorIds: readonly string[],
): boolean {
  return (
    multiEnabled &&
    (selectedSubtaskIds.length > 0 || selectedCollaboratorIds.length > 0)
  );
}
