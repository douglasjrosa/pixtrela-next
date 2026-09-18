import type { BoardSubTaskSummary } from "@/components/kanban/types";

export type BoardSubtaskLinkResult = {
  documentId: string;
  linkedToPrevious: boolean;
  assignedTo: { documentId: string; name: string }[];
};

const FINISHED_STATUS = "finished";

export type LinkDraftUpdate = {
  documentId: string;
  linkedToPrevious: boolean;
};

export function buildLinksSnapshot(
  subtasks: readonly BoardSubTaskSummary[],
): Record<string, boolean> {
  return Object.fromEntries(
    subtasks.map((subtask) => [
      subtask.documentId,
      subtask.linkedToPrevious,
    ]),
  );
}

export function collectDirtyLinkUpdates(
  subtasks: readonly BoardSubTaskSummary[],
  baseline: Readonly<Record<string, boolean>>,
): LinkDraftUpdate[] {
  const updates: LinkDraftUpdate[] = [];
  for (const subtask of subtasks) {
    if (subtask.status === FINISHED_STATUS) continue;
    const baselineLink = baseline[subtask.documentId] ?? false;
    if (subtask.linkedToPrevious === baselineLink) continue;
    updates.push({
      documentId: subtask.documentId,
      linkedToPrevious: subtask.linkedToPrevious,
    });
  }
  return updates;
}

export function hasLinkDraftChanges(
  subtasks: readonly BoardSubTaskSummary[],
  baseline: Readonly<Record<string, boolean>>,
): boolean {
  return collectDirtyLinkUpdates(subtasks, baseline).length > 0;
}

export function mergeLinksBaseline(
  baseline: Record<string, boolean>,
  loaded: readonly BoardSubTaskSummary[],
): Record<string, boolean> {
  const keepIds = new Set(loaded.map((item) => item.documentId));
  const next: Record<string, boolean> = {};
  for (const [id, linked] of Object.entries(baseline)) {
    if (keepIds.has(id)) next[id] = linked;
  }
  for (const item of loaded) {
    if (!(item.documentId in next)) {
      next[item.documentId] = item.linkedToPrevious;
    }
  }
  return next;
}
