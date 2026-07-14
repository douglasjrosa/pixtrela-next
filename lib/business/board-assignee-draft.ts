import type { BoardSubTaskSummary } from "@/components/kanban/types";
import type { TeamAssignmentOption } from "@/components/subtasks/subtask-manager";

export type AssigneeDraftUpdate = {
  documentId: string;
  assignedToIds: string[];
};

export function assigneeIdsKey(ids: string[]): string {
  return [...ids].sort().join(",");
}

export function getSubtaskAssigneeIds(subtask: BoardSubTaskSummary): string[] {
  return subtask.assignedTo.map((assignee) => assignee.documentId);
}

export function buildAssigneesSnapshot(
  subtasks: BoardSubTaskSummary[],
): Record<string, string> {
  return Object.fromEntries(
    subtasks.map((subtask) => [
      subtask.documentId,
      assigneeIdsKey(getSubtaskAssigneeIds(subtask)),
    ]),
  );
}

export function collectDirtyAssigneeUpdates(
  subtasks: BoardSubTaskSummary[],
  baseline: Record<string, string>,
): AssigneeDraftUpdate[] {
  const updates: AssigneeDraftUpdate[] = [];
  for (const subtask of subtasks) {
    const assignedToIds = getSubtaskAssigneeIds(subtask);
    const currentKey = assigneeIdsKey(assignedToIds);
    const baselineKey = baseline[subtask.documentId] ?? "";
    if (currentKey === baselineKey) continue;
    updates.push({ documentId: subtask.documentId, assignedToIds });
  }
  return updates;
}

export function hasAssigneeDraftChanges(
  subtasks: BoardSubTaskSummary[],
  baseline: Record<string, string>,
): boolean {
  return collectDirtyAssigneeUpdates(subtasks, baseline).length > 0;
}

export function resolveAssigneeNames(
  teams: TeamAssignmentOption[],
  assignedToIds: string[],
): BoardSubTaskSummary["assignedTo"] {
  const membersById = new Map(
    teams.flatMap((team) =>
      team.members.map((member) => [member.documentId, member.name] as const),
    ),
  );
  return assignedToIds.map((documentId) => ({
    documentId,
    name: membersById.get(documentId) ?? documentId,
  }));
}

export function mergeLoadedSubtasksWithDraft(
  loaded: BoardSubTaskSummary[],
  draft: BoardSubTaskSummary[],
): BoardSubTaskSummary[] {
  const draftById = new Map(draft.map((item) => [item.documentId, item]));
  return loaded.map((item) => {
    const existing = draftById.get(item.documentId);
    if (!existing) return item;
    return { ...item, assignedTo: existing.assignedTo };
  });
}

export function mergeAssigneesBaseline(
  baseline: Record<string, string>,
  loaded: BoardSubTaskSummary[],
): Record<string, string> {
  const keepIds = new Set(loaded.map((item) => item.documentId));
  const next: Record<string, string> = {};
  for (const [id, key] of Object.entries(baseline)) {
    if (keepIds.has(id)) next[id] = key;
  }
  for (const item of loaded) {
    if (!(item.documentId in next)) {
      next[item.documentId] = assigneeIdsKey(getSubtaskAssigneeIds(item));
    }
  }
  return next;
}
