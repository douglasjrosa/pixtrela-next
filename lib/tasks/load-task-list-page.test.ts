import { beforeEach, describe, expect, it, vi } from "vitest";

const listTasksPaged = vi.fn();

vi.mock("@/lib/repos/tasks", () => ({
  listTasksPaged: (...args: unknown[]) => listTasksPaged(...args),
}));

vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => unknown) => fn,
}));

import { loadTaskListPage } from "./load-task-list-page";

describe("loadTaskListPage", () => {
  beforeEach(() => {
    listTasksPaged.mockReset();
  });

  it("paginates drizzle tasks via listTasksPaged", async () => {
    listTasksPaged.mockResolvedValue({
      items: Array.from({ length: 10 }, (_, index) => ({
        id: `t-${index}`,
        name: `Task ${index}`,
        qty: 1,
        deliveryDate: "2026-07-01",
        status: "waiting",
        active: true,
        crmItemKey: null,
        totalExpectedTime: 10,
        totalTimeSpent: 0,
        finishedSubTaskCount: 0,
        totalSubTaskCount: 0,
      })),
      total: 12,
    });

    const result = await loadTaskListPage(
      {
        statuses: ["waiting"],
        from: "2026-06-01",
        to: "2026-07-15",
        column: "deliveryDate",
        direction: "asc",
        showArchived: false,
      },
      1,
    );

    expect(listTasksPaged).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        pageSize: 10,
        statuses: ["waiting"],
        from: "2026-06-01",
        to: "2026-07-15",
        showArchived: false,
      }),
    );
    expect(result.tasks).toHaveLength(10);
    expect(result.hasMore).toBe(true);
    expect(result.pageCount).toBe(2);
  });

  it("sets hasMore false on the last page", async () => {
    listTasksPaged.mockResolvedValue({
      items: [
        {
          id: "t-10",
          name: "Task 10",
          qty: 1,
          deliveryDate: "2026-07-01",
          status: "waiting",
          active: true,
          crmItemKey: null,
          totalExpectedTime: 10,
          totalTimeSpent: 0,
          finishedSubTaskCount: 0,
          totalSubTaskCount: 0,
        },
        {
          id: "t-11",
          name: "Task 11",
          qty: 1,
          deliveryDate: "2026-07-01",
          status: "waiting",
          active: true,
          crmItemKey: null,
          totalExpectedTime: 10,
          totalTimeSpent: 0,
          finishedSubTaskCount: 0,
          totalSubTaskCount: 0,
        },
      ],
      total: 12,
    });

    const result = await loadTaskListPage(
      {
        statuses: ["waiting"],
        from: "2026-06-01",
        to: "2026-07-15",
        column: "deliveryDate",
        direction: "asc",
        showArchived: false,
      },
      2,
    );
    expect(result.hasMore).toBe(false);
    expect(result.tasks).toHaveLength(2);
  });

  it("maps crmItemKey from drizzle tasks", async () => {
    listTasksPaged.mockResolvedValue({
      items: [
        {
          id: "crm-1",
          name: "Ecel - Autoclave 45L",
          crmItemKey: "42:0",
          qty: 1,
          deliveryDate: "2026-07-01",
          status: "waiting",
          active: true,
          totalExpectedTime: 10,
          totalTimeSpent: 0,
          finishedSubTaskCount: 1,
          totalSubTaskCount: 2,
        },
      ],
      total: 1,
    });

    const result = await loadTaskListPage(
      {
        statuses: ["waiting"],
        from: "2026-06-01",
        to: "2026-07-15",
        column: "deliveryDate",
        direction: "asc",
        showArchived: false,
      },
      1,
    );

    expect(result.tasks[0]?.crmItemKey).toBe("42:0");
    expect(result.tasks[0]?.finishedSubTaskCount).toBe(1);
    expect(result.tasks[0]?.totalSubTaskCount).toBe(2);
  });

  it("passes showArchived to listTasksPaged", async () => {
    listTasksPaged.mockResolvedValue({
      items: [
        {
          id: "archived-1",
          name: "Archived",
          qty: 1,
          deliveryDate: "2026-07-01",
          status: "waiting",
          active: false,
          crmItemKey: null,
          totalExpectedTime: 10,
          totalTimeSpent: 0,
          finishedSubTaskCount: 0,
          totalSubTaskCount: 0,
        },
      ],
      total: 1,
    });

    await loadTaskListPage(
      {
        statuses: ["waiting"],
        from: "2026-06-01",
        to: "2026-07-15",
        column: "deliveryDate",
        direction: "asc",
        showArchived: true,
      },
      1,
    );

    expect(listTasksPaged).toHaveBeenCalledWith(
      expect.objectContaining({ showArchived: true }),
    );
  });
});
