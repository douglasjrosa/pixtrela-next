import { beforeEach, describe, expect, it, vi } from "vitest";

const strapiFetch = vi.fn();

vi.mock("@/lib/strapi", () => ({
  STRAPI_TAGS: { tasks: "strapi:tasks" },
  strapiFetch: (...args: unknown[]) => strapiFetch(...args),
}));

import { loadTaskListPage } from "./load-task-list-page";

describe("loadTaskListPage", () => {
  beforeEach(() => {
    strapiFetch.mockReset();
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
});
