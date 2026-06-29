import { applySequentialSubTaskIndices } from "@/lib/business/subtask-order";

import { buildClonedSubTaskName } from "./subtask-clone";

const DRAFT_PREFIX = "draft:";

export function isDraftSubTaskId(documentId: string): boolean {
  return documentId.startsWith(DRAFT_PREFIX);
}

export function createDraftSubTaskId(): string {
  return `${DRAFT_PREFIX}${crypto.randomUUID()}`;
}

type DraftableSubTask = {
  documentId: string;
  name: string;
  index: number;
  timeSpent: number;
  isDraft?: boolean;
};

export function insertDraftSubTaskCloneAt<T extends DraftableSubTask>(
  items: T[],
  sourceArrayIndex: number,
): T[] {
  const source = items[sourceArrayIndex];
  if (!source) return items;

  const draft = {
    ...source,
    documentId: createDraftSubTaskId(),
    isDraft: true,
    name: buildClonedSubTaskName(source.name),
    timeSpent: 0,
  } as T;

  const next = [...items];
  next.splice(sourceArrayIndex + 1, 0, draft);
  return applySequentialSubTaskIndices(next);
}

export function mergeServerSubtasksWithDrafts<T extends DraftableSubTask>(
  serverSubtasks: T[],
  drafts: T[],
): T[] {
  if (drafts.length === 0) return serverSubtasks;

  const merged = [...serverSubtasks];
  for (const draft of [...drafts].sort((a, b) => a.index - b.index)) {
    const insertAt = Math.min(Math.max(draft.index, 0), merged.length);
    merged.splice(insertAt, 0, draft);
  }
  return applySequentialSubTaskIndices(merged);
}
