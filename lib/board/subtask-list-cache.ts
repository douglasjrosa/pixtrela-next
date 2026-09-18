import type { BoardSubTaskSummary } from "@/components/kanban/types";
import { buildAssigneesSnapshot } from "@/lib/business/board-assignee-draft";
import { buildLinksSnapshot } from "@/lib/business/board-link-queue";

export const SUBTASK_LIST_CACHE_TTL_MS = 60_000;

export type SubtaskListCacheEntry = {
  subtasks: BoardSubTaskSummary[];
  assigneesBaseline: Record<string, string>;
  linksBaseline: Record<string, boolean>;
  loadedAt: number;
};

export function createSubtaskListCacheEntry(
  subtasks: BoardSubTaskSummary[],
  loadedAt = Date.now(),
): SubtaskListCacheEntry {
  return {
    subtasks,
    assigneesBaseline: buildAssigneesSnapshot(subtasks),
    linksBaseline: buildLinksSnapshot(subtasks),
    loadedAt,
  };
}

export class SubtaskListCache {
  private readonly entries = new Map<string, SubtaskListCacheEntry>();

  get(taskDocumentId: string, now = Date.now()): SubtaskListCacheEntry | null {
    const entry = this.entries.get(taskDocumentId);
    if (!entry) return null;
    if (now - entry.loadedAt > SUBTASK_LIST_CACHE_TTL_MS) {
      this.entries.delete(taskDocumentId);
      return null;
    }
    return entry;
  }

  set(taskDocumentId: string, entry: SubtaskListCacheEntry): void {
    this.entries.set(taskDocumentId, entry);
  }

  invalidate(taskDocumentId: string): void {
    this.entries.delete(taskDocumentId);
  }

  clear(): void {
    this.entries.clear();
  }
}
