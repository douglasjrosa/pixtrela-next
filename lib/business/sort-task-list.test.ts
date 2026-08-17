import { describe, expect, it } from "vitest";

import { sortTaskListRows } from "./sort-task-list";

describe("sortTaskListRows", () => {
  const rows = [
    {
      id: "b",
      name: "Bravo",
      qty: 2,
      deliveryDate: "2026-07-02",
      status: "producing",
      totalTimeSpent: 20,
    },
    {
      id: "a",
      name: "Alpha",
      qty: 1,
      deliveryDate: "2026-07-01",
      status: "waiting",
      totalTimeSpent: 10,
    },
  ];

  it("sorts by delivery date ascending", () => {
    const sorted = sortTaskListRows(rows, {
      column: "deliveryDate",
      direction: "asc",
    });
    expect(sorted.map((row) => row.id)).toEqual(["a", "b"]);
  });

  it("sorts by name descending", () => {
    const sorted = sortTaskListRows(rows, {
      column: "name",
      direction: "desc",
    });
    expect(sorted.map((row) => row.id)).toEqual(["b", "a"]);
  });

  it("sorts by finished sub-task counts", () => {
    const sorted = sortTaskListRows(
      rows,
      { column: "finishedSubTasks", direction: "asc" },
      new Map([
        ["a", { finishedCount: 2, totalCount: 3 }],
        ["b", { finishedCount: 1, totalCount: 5 }],
      ]),
    );
    expect(sorted.map((row) => row.id)).toEqual(["b", "a"]);
  });
});
