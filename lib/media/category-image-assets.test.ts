import { beforeEach, describe, expect, it, vi } from "vitest";

const storeMedia = vi.fn();
const insertMediaAsset = vi.fn();
const listMediaAssets = vi.fn();

vi.mock("@/lib/media/store-media", () => ({
  storeMedia: (...args: unknown[]) => storeMedia(...args),
}));

vi.mock("@/lib/repos/media", () => ({
  insertMediaAsset: (...args: unknown[]) => insertMediaAsset(...args),
  listMediaAssets: (...args: unknown[]) => listMediaAssets(...args),
}));

describe("category-image-assets", () => {
  beforeEach(() => {
    storeMedia.mockReset();
    insertMediaAsset.mockReset();
    listMediaAssets.mockReset();
  });

  it("lists images for a media category", async () => {
    listMediaAssets.mockResolvedValue({
      items: [{ id: "media-1" }],
      total: 1,
    });

    const { listCategoryImageAssets } = await import("./category-image-assets");
    const items = await listCategoryImageAssets("currency");

    expect(listMediaAssets).toHaveBeenCalledWith({
      mimeFilter: "image",
      category: "currency",
      includeBiometric: false,
      page: 1,
      pageSize: 100,
    });
    expect(items).toEqual([{ id: "media-1" }]);
  });

  it("stores an uploaded image for a media category", async () => {
    storeMedia.mockResolvedValue({
      storageKey: "k",
      url: "/media/x.png",
      mimeType: "image/png",
      byteSize: 4,
    });
    insertMediaAsset.mockResolvedValue({ id: "media-new" });

    const formData = new FormData();
    formData.append(
      "file",
      new File(["img"], "icon.png", { type: "image/png" }),
    );

    const { uploadCategoryImageAsset } = await import("./category-image-assets");
    const asset = await uploadCategoryImageAsset(formData, "award");

    expect(storeMedia).toHaveBeenCalled();
    expect(insertMediaAsset).toHaveBeenCalledWith(
      expect.objectContaining({ storageKey: "k" }),
      {
        originalFilename: "icon.png",
        category: "award",
        sensitivity: "public",
      },
    );
    expect(asset).toEqual({ id: "media-new" });
  });
});
