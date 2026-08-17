import type { BoardSubTaskSummary } from "@/components/kanban/types";
import type { TeamAssignmentOption } from "@/components/subtasks/subtask-manager";
import { adjustAssignedCount } from "@/lib/business/assign-warn";

export type AssigneeDraftUpdate = {
  documentId: string;
  assignedToIds: string[];
};

const FINISHED_STATUS = "finished";

export function assigneeIdsKey(ids: string[]): string {
  return [...ids].sort().join(",");
}

export function parseAssigneeIdsKey(key: string): string[] {
  if (!key) return [];
  return key.split(",").filter(Boolean);
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

/**
 * Rebases board-wide server counts with unsaved assignee toggles so polls do
 * not wipe local draft warn badges.
 */
export function applyAssigneeDraftDeltasToCounts(
  serverCounts: Readonly<Record<string, number>>,
  subtasks: readonly BoardSubTaskSummary[],
  baseline: Readonly<Record<string, string>>,
): Record<string, number> {
  let counts = { ...serverCounts };
  for (const subtask of subtasks) {
    if (subtask.status === FINISHED_STATUS) continue;
    const baselineIds = new Set(
      parseAssigneeIdsKey(baseline[subtask.documentId] ?? ""),
    );
    const currentIds = new Set(getSubtaskAssigneeIds(subtask));
    for (const id of currentIds) {
      if (!baselineIds.has(id)) {
        counts = adjustAssignedCount(counts, id, 1);
      }
    }
    for (const id of baselineIds) {
      if (!currentIds.has(id)) {
        counts = adjustAssignedCount(counts, id, -1);
      }
    }
  }
  return counts;
}

export function ingestAssigneeDirectory(
  directory: Map<string, string>,
  people: readonly { documentId: string; name?: string | null }[],
): void {
  for (const person of people) {
    const name = person.name?.trim() ?? "";
    if (!name) continue;
    if (directory.has(person.documentId)) continue;
    directory.set(person.documentId, name);
  }
}

export function ingestTeamsIntoAssigneeDirectory(
  directory: Map<string, string>,
  teams: readonly TeamAssignmentOption[],
): void {
  for (const team of teams) {
    ingestAssigneeDirectory(directory, team.members);
  }
}

export function ingestSubtasksIntoAssigneeDirectory(
  directory: Map<string, string>,
  items: readonly BoardSubTaskSummary[],
): void {
  for (const item of items) {
    ingestAssigneeDirectory(directory, item.assignedTo);
    ingestAssigneeDirectory(
      directory,
      item.sessions.map((session) => ({
        documentId: session.colaboratorDocumentId,
        name: session.colaboratorName,
      })),
    );
  }
}

export function mergeAssigneesByIds(
  existing: readonly BoardSubTaskSummary["assignedTo"][number][],
  nextIds: readonly string[],
  directory: ReadonlyMap<string, string>,
): BoardSubTaskSummary["assignedTo"] {
  const byId = new Map(
    existing.map((assignee) => [assignee.documentId, assignee]),
  );
  return nextIds.map((documentId) => {
    const previous = byId.get(documentId);
    if (previous?.name) return previous;
    return { documentId, name: directory.get(documentId) ?? "" };
  });
}

export function resolveAssigneeNames(
  teams: TeamAssignmentOption[],
  assignedToIds: string[],
  knownAssignees: readonly { documentId: string; name: string }[] = [],
): BoardSubTaskSummary["assignedTo"] {
  const directory = new Map<string, string>();
  ingestAssigneeDirectory(directory, knownAssignees);
  ingestTeamsIntoAssigneeDirectory(directory, teams);
  return mergeAssigneesByIds([], assignedToIds, directory);
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
