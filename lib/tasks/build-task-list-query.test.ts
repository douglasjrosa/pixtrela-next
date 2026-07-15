import { describe, expect, it } from "vitest";

import { TASK_LIST_PAGE_SIZE } from "@/lib/schemas/task-list-filters";

import { buildTaskListQuery } from "./build-task-list-query";

describe("buildTaskListQuery", () => {
  it("builds filters sort and pagination without upper date bound", () => {
    const query = buildTaskListQuery(
      {
        statuses: ["paused", "producing", "waiting"],
        from: "2026-06-15",
      },
      1,
    );

    expect(query.sort).toBe("deliveryDate:asc");
    expect(query.pagination).toEqual({
      page: 1,
      pageSize: TASK_LIST_PAGE_SIZE,
    });
    expect(query.filters).toEqual({
      status: { $in: ["paused", "producing", "waiting"] },
      deliveryDate: { $gte: "2026-06-15" },
    });
    expect(query.filters).not.toHaveProperty("name");
  });

  it("adds to and name containsi when present", () => {
    const query = buildTaskListQuery(
      {
        statuses: ["finished"],
        from: "2026-01-01",
        to: "2026-12-31",
        q: "Mont",
      },
      2,
    );

    expect(query.filters).toEqual({
      status: { $in: ["finished"] },
      deliveryDate: { $gte: "2026-01-01", $lte: "2026-12-31" },
      name: { $containsi: "Mont" },
    });
    expect(query.pagination?.page).toBe(2);
  });

  it("clamps page to at least 1", () => {
    const query = buildTaskListQuery(
      { statuses: ["waiting"], from: "2026-06-15" },
      0,
    );
    expect(query.pagination?.page).toBe(1);
  });
});
