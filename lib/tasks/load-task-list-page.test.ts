import { beforeEach, describe, expect, it, vi } from "vitest";

const strapiFetch = vi.fn();
const listTasks = vi.fn();
const isDrizzleBackend = vi.fn(() => false);

vi.mock("@/lib/db/backend", () => ({
  isDrizzleBackend: () => isDrizzleBackend(),
}));

vi.mock("@/lib/strapi", () => ({
  STRAPI_TAGS: { tasks: "strapi:tasks" },
  strapiFetch: (...args: unknown[]) => strapiFetch(...args),
}));

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
    strapiFetch.mockReset();
    listTasks.mockReset();
    isDrizzleBackend.mockReturnValue(false);
  });

  it("maps entities and derives hasMore from Strapi meta", async () => {
    strapiFetch.mockResolvedValueOnce({
      data: [
        {
          documentId: "t1",
          name: "Montagem",
          qty: 2,
          index: 0,
          status: "waiting",
          deliveryDate: "2026-07-01",
          totalExpectedTime: 60,
          totalTimeSpent: 30,
        },
      ],
      meta: {
        pagination: { page: 1, pageSize: 10, pageCount: 3, total: 25 },
      },
    });

    const result = await loadTaskListPage(
      { statuses: ["waiting"], from: "2026-06-01" },
      1,
    );

    expect(result.hasMore).toBe(true);
    expect(result.pageCount).toBe(3);
    expect(result.tasks).toEqual([
      expect.objectContaining({
        documentId: "t1",
        name: "Montagem",
        totalExpectedTime: 60,
        totalTimeSpent: 30,
        active: true,
      }),
    ]);
    expect(strapiFetch).toHaveBeenCalledWith(
      "/tasks",
      { strapiCache: { tags: ["strapi:tasks"], revalidate: 30 } },
      expect.objectContaining({
        sort: "deliveryDate:asc",
        pagination: { page: 1, pageSize: 10 },
      }),
    );
  });

  it("sets hasMore false on the last page", async () => {
    strapiFetch.mockResolvedValueOnce({
      data: [],
      meta: {
        pagination: { page: 2, pageSize: 10, pageCount: 2, total: 12 },
      },
    });

    const result = await loadTaskListPage(
      { statuses: ["waiting"], from: "2026-06-01" },
      2,
    );
    expect(result.hasMore).toBe(false);
  });

  it("paginates drizzle tasks without calling Strapi", async () => {
    isDrizzleBackend.mockReturnValue(true);
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

    expect(strapiFetch).not.toHaveBeenCalled();
    expect(result.tasks).toHaveLength(10);
    expect(result.hasMore).toBe(true);
    expect(result.pageCount).toBe(2);
  });
});
