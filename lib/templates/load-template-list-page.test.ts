import { beforeEach, describe, expect, it, vi } from "vitest";

const listTemplateTasks = vi.fn();

vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => unknown) => () => fn(),
}));

vi.mock("@/lib/repos/templates", () => ({
  listTemplateTasks: (...args: unknown[]) => listTemplateTasks(...args),
}));

import { loadTemplateListPage } from "./load-template-list-page";

describe("loadTemplateListPage", () => {
  beforeEach(() => {
    listTemplateTasks.mockReset();
  });

  it("maps drizzle templates and derives pagination", async () => {
    listTemplateTasks.mockResolvedValueOnce({
      items: [
        {
          id: "tpl1",
          name: "Montagem",
          code: "100",
          subTaskCount: 2,
          active: true,
        },
      ],
      total: 12,
    });

    const result = await loadTemplateListPage(
      { q: undefined, column: "name", direction: "asc", showArchived: false },
      1,
    );

    expect(listTemplateTasks).toHaveBeenCalledWith({
      q: undefined,
      page: 1,
      pageSize: 10,
      sort: { column: "name", direction: "asc" },
      showArchived: false,
    });

    expect(result.hasMore).toBe(true);
    expect(result.pageCount).toBe(2);
    expect(result.templates).toEqual([
      {
        documentId: "tpl1",
        name: "Montagem",
        code: "100",
        subTaskCount: 2,
        active: true,
      },
    ]);
  });
});
