import { describe, expect, it } from "vitest";

import type { KanbanTask } from "@/components/kanban/types";
import type { BoardColumnState } from "@/lib/board/board-column-state";
import { appendBoardColumnPage } from "./append-column-page";

function task(documentId: string, index: number): KanbanTask {
  return {
    id: index + 1,
    documentId,
    name: documentId,
    qty: 1,
    status: "waiting",
    stepId: 0,
    index,
    totalExpectedTime: 0,
    totalTimeSpent: 0,
  };
}

function column(partial: Partial<BoardColumnState> = {}): BoardColumnState {
  return {
    stepDocumentId: "step-1",
    totalCount: 20,
    tasks: [task("a", 0), task("b", 1)],
    cursor: {
      id: "b",
      index: 1,
      deliveryDate: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    loadingMore: true,
    loadMoreError: false,
    ...partial,
  };
}

describe("appendBoardColumnPage", () => {
  it("appends unique tasks and advances the cursor", () => {
    const next = appendBoardColumnPage(column(), {
      tasks: [task("b", 1), task("c", 2), task("d", 3)],
      cursor: {
        id: "d",
        index: 3,
        deliveryDate: null,
        createdAt: "2026-01-02T00:00:00.000Z",
      },
      totalCount: 20,
    });

    expect(next.tasks.map((row) => row.documentId)).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
    expect(next.cursor?.id).toBe("d");
    expect(next.loadingMore).toBe(false);
    expect(next.totalCount).toBe(20);
  });

  it("clamps totalCount when the cursor is stuck with no new tasks", () => {
    const current = column();
    const next = appendBoardColumnPage(current, {
      tasks: [task("a", 0), task("b", 1)],
      cursor: current.cursor,
      totalCount: 20,
    });

    expect(next.tasks).toHaveLength(2);
    expect(next.totalCount).toBe(2);
    expect(next.loadingMore).toBe(false);
  });
});
