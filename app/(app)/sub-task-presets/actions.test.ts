import { beforeEach, describe, expect, it, vi } from "vitest";

const strapiFetch = vi.fn();
const auth = vi.fn(async () => ({ user: { role: "manager" } }));
const revalidateStrapiTags = vi.fn();

vi.mock("@/auth", () => ({
  auth: (...args: unknown[]) => auth(...args),
}));

vi.mock("@/lib/strapi", () => ({
  strapiFetch,
  STRAPI_TAGS: { subTaskPresets: "strapi:sub-task-presets" },
}));

vi.mock("@/lib/strapi/revalidate", () => ({
  revalidateStrapiTags: (...args: unknown[]) => revalidateStrapiTags(...args),
}));

describe("sub-task-presets actions", () => {
  beforeEach(() => {
    strapiFetch.mockReset();
    auth.mockReset();
    revalidateStrapiTags.mockReset();
    auth.mockResolvedValue({ user: { role: "manager" } });
    vi.resetModules();
  });

  it("searchSubTaskPresets returns empty without calling Strapi when query is short", async () => {
    const { searchSubTaskPresets } = await import("./actions");
    await expect(searchSubTaskPresets("ab")).resolves.toEqual([]);
    expect(strapiFetch).not.toHaveBeenCalled();
  });

  it("searchSubTaskPresets searches presets by name with containsi", async () => {
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
  });

  it("listSubTaskPresets returns ordered presets", async () => {
    strapiFetch.mockResolvedValue({
      data: [
        {
          documentId: "p1",
          name: "A",
          sharingType: "qty",
          maxSameTimeWorkers: 1,
          expectedTime: 10,
        },
      ],
    });

    const { listSubTaskPresets } = await import("./actions");
    await expect(listSubTaskPresets()).resolves.toHaveLength(1);
    expect(strapiFetch).toHaveBeenCalledWith(
      "/sub-task-presets",
      expect.objectContaining({
        strapiCache: expect.objectContaining({
          tags: ["strapi:sub-task-presets"],
        }),
      }),
      expect.objectContaining({ sort: "name:asc" }),
    );
  });

  it("createSubTaskPreset posts payload and returns documentId", async () => {
    strapiFetch.mockResolvedValue({ data: { documentId: "p-new" } });
    const { createSubTaskPreset } = await import("./actions");
    const id = await createSubTaskPreset({
      name: "Corte",
      sharingType: "duration",
      maxSameTimeWorkers: 2,
      expectedTime: 60,
    });
    expect(id).toBe("p-new");
    expect(revalidateStrapiTags).toHaveBeenCalledWith("strapi:sub-task-presets");
  });

  it("updateSubTaskPreset puts payload", async () => {
    strapiFetch.mockResolvedValue({});
    const { updateSubTaskPreset } = await import("./actions");
    await updateSubTaskPreset("p1", {
      name: "Corte",
      sharingType: "qty",
      maxSameTimeWorkers: 1,
      expectedTime: 30,
    });
    expect(strapiFetch).toHaveBeenCalledWith(
      "/sub-task-presets/p1",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("deleteSubTaskPreset deletes by id", async () => {
    strapiFetch.mockResolvedValue({});
    const { deleteSubTaskPreset } = await import("./actions");
    await deleteSubTaskPreset("p1");
    expect(strapiFetch).toHaveBeenCalledWith(
      "/sub-task-presets/p1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("rejects leader from managing presets", async () => {
    auth.mockResolvedValue({ user: { role: "leader" } });
    const { listSubTaskPresets } = await import("./actions");
    await expect(listSubTaskPresets()).rejects.toThrow("forbidden");
  });

  it("rejects unauthorized roles from search", async () => {
    auth.mockResolvedValue({ user: { role: "colaborator" } });
    const { searchSubTaskPresets } = await import("./actions");
    await expect(searchSubTaskPresets("corte")).rejects.toThrow("forbidden");
  });
});
