import { describe, expect, it } from "vitest";

import {
  boardColumnCursorFromTask,
  selectBoardColumnPage,
  type BoardColumnOrderTask,
} from "./column-task-page";

const baseCreated = new Date("2026-01-01T10:00:00.000Z");

function task(
  partial: Partial<BoardColumnOrderTask> & Pick<BoardColumnOrderTask, "id">,
): BoardColumnOrderTask {
  return {
    index: 0,
    deliveryDate: null,
    createdAt: baseCreated,
    ...partial,
  };
}

describe("selectBoardColumnPage", () => {
  it("returns the first page ordered by manual index then id", () => {
    const rows = [
      task({ id: "c", index: 2 }),
      task({ id: "a", index: 0 }),
      task({ id: "b", index: 1 }),
      task({ id: "d", index: 3 }),
    ];

    const page = selectBoardColumnPage(rows, "manual", { limit: 2 });
    expect(page.map((row) => row.id)).toEqual(["a", "b"]);
  });

  it("uses keyset cursor for the next manual page", () => {
    const rows = [
      task({ id: "a", index: 0 }),
      task({ id: "b", index: 1 }),
      task({ id: "c", index: 2 }),
      task({ id: "d", index: 3 }),
    ];
    const first = selectBoardColumnPage(rows, "manual", { limit: 2 });
    const cursor = boardColumnCursorFromTask(first[first.length - 1]!);
    const second = selectBoardColumnPage(rows, "manual", {
      limit: 2,
      cursor,
    });
    expect(second.map((row) => row.id)).toEqual(["c", "d"]);
  });

  it("pages delivery_date_asc with nulls last", () => {
    const rows = [
      task({ id: "null", deliveryDate: null }),
      task({ id: "late", deliveryDate: "2026-02-01" }),
      task({ id: "early", deliveryDate: "2026-01-01" }),
    ];
    const page = selectBoardColumnPage(rows, "delivery_date_asc", { limit: 2 });
    expect(page.map((row) => row.id)).toEqual(["early", "late"]);
  });

  it("pages created_at_desc after cursor", () => {
    const rows = [
      task({ id: "old", createdAt: new Date("2026-01-01T10:00:00.000Z") }),
      task({ id: "mid", createdAt: new Date("2026-01-02T10:00:00.000Z") }),
      task({ id: "new", createdAt: new Date("2026-01-03T10:00:00.000Z") }),
    ];
    const first = selectBoardColumnPage(rows, "created_at_desc", { limit: 1 });
    expect(first.map((row) => row.id)).toEqual(["new"]);
    const cursor = boardColumnCursorFromTask(first[0]!);
    const second = selectBoardColumnPage(rows, "created_at_desc", {
      limit: 2,
      cursor,
    });
    expect(second.map((row) => row.id)).toEqual(["mid", "old"]);
  });
});
