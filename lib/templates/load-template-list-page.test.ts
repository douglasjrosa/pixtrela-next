import { beforeEach, describe, expect, it, vi } from "vitest";

const strapiFetch = vi.fn();

vi.mock("@/lib/strapi", () => ({
  STRAPI_TAGS: { templateTasks: "strapi:template-tasks" },
  strapiFetch: (...args: unknown[]) => strapiFetch(...args),
}));

import { loadTemplateListPage } from "./load-template-list-page";

describe("loadTemplateListPage", () => {
  beforeEach(() => {
    strapiFetch.mockReset();
  });

  it("maps entities and derives hasMore from Strapi meta", async () => {
    strapiFetch.mockResolvedValueOnce({
      data: [
        {
          documentId: "tpl1",
          name: "Montagem",
          code: "100",
          subTask: [{ name: "Corte" }, { name: "Solda" }],
        },
      ],
      meta: {
        pagination: { page: 1, pageSize: 10, pageCount: 2, total: 12 },
      },
    });

    const result = await loadTemplateListPage({}, 1);

    expect(result.hasMore).toBe(true);
    expect(result.pageCount).toBe(2);
    expect(result.templates).toEqual([
      {
        documentId: "tpl1",
        name: "Montagem",
        code: "100",
        subTaskCount: 2,
      },
    ]);
    expect(strapiFetch).toHaveBeenCalledWith(
      "/template-tasks",
      { strapiCache: { tags: ["strapi:template-tasks"], revalidate: 30 } },
      expect.objectContaining({
        sort: "name:asc",
        pagination: { page: 1, pageSize: 10 },
      }),
    );
  });
});
