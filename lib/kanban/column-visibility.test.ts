import { describe, expect, it } from "vitest";

import {
  KANBAN_COLUMN_INITIAL_VISIBLE_COUNT,
  kanbanColumnHasMore,
  nextKanbanColumnVisibleCount,
  sliceVisibleKanbanTasks,
} from "./column-visibility";

describe("column visibility", () => {
  const tasks = Array.from({ length: 25 }, (_, index) => ({ id: index }));

  it("shows only the initial page of cards", () => {
    const visible = sliceVisibleKanbanTasks(
      tasks,
      KANBAN_COLUMN_INITIAL_VISIBLE_COUNT,
    );
    expect(visible).toHaveLength(10);
    expect(visible[0]?.id).toBe(0);
    expect(visible[9]?.id).toBe(9);
  });

  it("reports more cards when the column exceeds the visible count", () => {
    expect(kanbanColumnHasMore(25, 10)).toBe(true);
    expect(kanbanColumnHasMore(10, 10)).toBe(false);
    expect(kanbanColumnHasMore(3, 10)).toBe(false);
  });

  it("loads the next page without exceeding the total", () => {
    expect(nextKanbanColumnVisibleCount(10, 25)).toBe(20);
    expect(nextKanbanColumnVisibleCount(20, 25)).toBe(25);
    expect(nextKanbanColumnVisibleCount(25, 25)).toBe(25);
  });
});
