import { beforeEach, describe, expect, it, vi } from "vitest";

const listTasks = vi.fn();

vi.mock("@/lib/repos/tasks", () => ({
  listTasks: (...args: unknown[]) => listTasks(...args),
}));

vi.mock("@/lib/db/client", () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => [],
        }),
      }),
    }),
  }),
}));

import { loadTaskListPage } from "./load-task-list-page";

describe("loadTaskListPage", () => {
  beforeEach(() => {
    listTasks.mockReset();
  });

  it("paginates drizzle tasks", async () => {
    listTasks.mockResolvedValue(
      Array.from({ length: 12 }, (_, index) => ({
        id: `t-${index}`,
        name: `Task ${index}`,
        qty: 1,
        deliveryDate: "2026-07-01",
        index,
        status: "waiting",
        active: true,
        templateTaskCode: null,
        totalExpectedTime: 10,
        totalTimeSpent: 0,
        stepId: null,
      })),
    );

    const result = await loadTaskListPage(
      { statuses: ["waiting"], from: "2026-06-01" },
      1,
    );

    expect(result.tasks).toHaveLength(10);
    expect(result.hasMore).toBe(true);
    expect(result.pageCount).toBe(2);
  });

  it("sets hasMore false on the last page", async () => {
    listTasks.mockResolvedValue(
      Array.from({ length: 12 }, (_, index) => ({
        id: `t-${index}`,
        name: `Task ${index}`,
        qty: 1,
        deliveryDate: "2026-07-01",
        index,
        status: "waiting",
        active: true,
        templateTaskCode: null,
        totalExpectedTime: 10,
        totalTimeSpent: 0,
        stepId: null,
      })),
    );

    const result = await loadTaskListPage(
      { statuses: ["waiting"], from: "2026-06-01" },
      2,
    );
    expect(result.hasMore).toBe(false);
    expect(result.tasks).toHaveLength(2);
  });
});
