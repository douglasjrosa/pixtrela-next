import { beforeEach, describe, expect, it, vi } from "vitest";

const listAwardsPage = vi.fn();

vi.mock("@/lib/repos/awards", () => ({
  listAwardsPage: (...args: unknown[]) => listAwardsPage(...args),
}));

import { loadAwardListPage } from "./load-award-list-page";

describe("loadAwardListPage", () => {
  beforeEach(() => {
    listAwardsPage.mockReset();
  });

  it("maps awards and derives pagination", async () => {
    listAwardsPage.mockResolvedValueOnce({
      items: [
        {
          id: "a1",
          name: "arroz-sku",
          title: "Arroz",
          description: null,
          warnings: null,
          active: true,
          stock: 0,
          imageMediaId: null,
          imageUrl: null,
          prices: [{ numberOf: 50, currencyId: "c1" }],
        },
      ],
      total: 12,
    });

    const result = await loadAwardListPage(
      { q: undefined, column: "title", direction: "asc", showArchived: false },
      1,
    );

    expect(listAwardsPage).toHaveBeenCalledWith({
      q: undefined,
      page: 1,
      pageSize: 10,
      sort: { column: "title", direction: "asc" },
      showArchived: false,
    });
    expect(result.hasMore).toBe(true);
    expect(result.pageCount).toBe(2);
    expect(result.awards).toEqual([
      {
        documentId: "a1",
        name: "arroz-sku",
        title: "Arroz",
        description: null,
        warnings: null,
        active: true,
        stock: 0,
        imageId: null,
        imageUrl: null,
        values: [{ numberOf: 50, currencyDocumentId: "c1" }],
      },
    ]);
  });
});
