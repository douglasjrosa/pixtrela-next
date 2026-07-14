import { beforeEach, describe, expect, it, vi } from "vitest";

const strapiFetch = vi.fn();
const auth = vi.fn(async () => ({ user: { role: "manager" } }));

vi.mock("@/auth", () => ({
  auth: (...args: unknown[]) => auth(...args),
}));

vi.mock("@/lib/strapi", () => ({
  strapiFetch,
  STRAPI_TAGS: { subTaskPresets: "strapi:sub-task-presets" },
}));

describe("searchSubTaskPresets", () => {
  beforeEach(() => {
    strapiFetch.mockReset();
    auth.mockReset();
    auth.mockResolvedValue({ user: { role: "manager" } });
    vi.resetModules();
  });

  it("returns empty without calling Strapi when query is shorter than 3", async () => {
    const { searchSubTaskPresets } = await import("./actions");
    await expect(searchSubTaskPresets("ab")).resolves.toEqual([]);
    expect(strapiFetch).not.toHaveBeenCalled();
  });

  it("searches presets by name with containsi", async () => {
    strapiFetch.mockResolvedValue({
      data: [
        {
          documentId: "p1",
          name: "Corte dos sarrafos",
          sharingType: "qty",
          maxSameTimeWorkers: 2,
          expectedTime: 120,
        },
      ],
    });

    const { searchSubTaskPresets } = await import("./actions");
    const result = await searchSubTaskPresets("cor");

    expect(result).toEqual([
      {
        documentId: "p1",
        name: "Corte dos sarrafos",
        sharingType: "qty",
        maxSameTimeWorkers: 2,
        expectedTime: 120,
      },
    ]);
    expect(strapiFetch).toHaveBeenCalledWith(
      "/sub-task-presets",
      expect.objectContaining({ strapiCache: { noStore: true } }),
      expect.objectContaining({
        fields: [
          "documentId",
          "name",
          "sharingType",
          "maxSameTimeWorkers",
          "expectedTime",
        ],
        filters: { name: { $containsi: "cor" } },
        sort: "name:asc",
        pagination: { pageSize: 10 },
      }),
    );
  });

  it("rejects unauthorized roles", async () => {
    auth.mockResolvedValue({ user: { role: "colaborator" } });
    const { searchSubTaskPresets } = await import("./actions");
    await expect(searchSubTaskPresets("corte")).rejects.toThrow("forbidden");
  });
});
