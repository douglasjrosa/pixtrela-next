import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
const revalidatePath = vi.fn();
const createAwardRepo = vi.fn();
const replaceAwardPrices = vi.fn();
const deleteAwardRepo = vi.fn();
const findAwardById = vi.fn();
const hardDeleteAward = vi.fn();
const getDb = vi.fn();
const storeMedia = vi.fn();
const insertMediaAsset = vi.fn();
const listMediaAssets = vi.fn();

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { role: "admin" }, jwt: "" })),
}));

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

vi.mock("@/lib/repos/awards", () => ({
  createAward: (...args: unknown[]) => createAwardRepo(...args),
  replaceAwardPrices: (...args: unknown[]) => replaceAwardPrices(...args),
  deleteAward: (...args: unknown[]) => deleteAwardRepo(...args),
  findAwardById: (...args: unknown[]) => findAwardById(...args),
  hardDeleteAward: (...args: unknown[]) => hardDeleteAward(...args),
}));

const loadAwardListPageMock = vi.fn();

vi.mock("@/lib/awards/load-award-list-page", () => ({
  loadAwardListPage: (...args: unknown[]) => loadAwardListPageMock(...args),
}));

const resolveAwardPricesOnSave = vi.fn();

vi.mock("@/lib/awards/resolve-award-prices-on-save", () => ({
  resolveAwardPricesOnSave: (...args: unknown[]) =>
    resolveAwardPricesOnSave(...args),
}));

vi.mock("@/lib/db/client", () => ({
  getDb: () => getDb(),
}));

vi.mock("@/lib/media/store-media", () => ({
  storeMedia: (...args: unknown[]) => storeMedia(...args),
}));

vi.mock("@/lib/repos/media", () => ({
  insertMediaAsset: (...args: unknown[]) => insertMediaAsset(...args),
  listMediaAssets: (...args: unknown[]) => listMediaAssets(...args),
}));

describe("awards/actions drizzle CRUD", () => {
  const update = vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  });

  beforeEach(() => {
    vi.resetModules();
    revalidateTag.mockReset();
    revalidatePath.mockReset();
    createAwardRepo.mockReset();
    replaceAwardPrices.mockReset();
    deleteAwardRepo.mockReset();
    findAwardById.mockReset();
    hardDeleteAward.mockReset();
    storeMedia.mockReset();
    insertMediaAsset.mockReset();
    listMediaAssets.mockReset();
    loadAwardListPageMock.mockReset();
    getDb.mockReturnValue({ update });
    resolveAwardPricesOnSave.mockReset();
    resolveAwardPricesOnSave.mockImplementation(
      async ({ manualPrices }: { manualPrices: unknown[] }) => manualPrices,
    );
    update.mockClear();
  });

  it("loadMoreAwards parses filters and loads a page", async () => {
    loadAwardListPageMock.mockResolvedValueOnce({
      awards: [],
      page: 2,
      pageCount: 2,
      hasMore: false,
    });
    const { loadMoreAwards } = await import("./actions");
    await loadMoreAwards(
      { column: "title", direction: "asc", showArchived: false },
      2,
    );
    expect(loadAwardListPageMock).toHaveBeenCalledWith(
      { q: undefined, column: "title", direction: "asc", showArchived: false },
      2,
    );
  });

  it("createAward writes through repo", async () => {
    const { createAward } = await import("./actions");
    await createAward({
      name: "Arroz",
      title: "Arroz",
      description: "",
      warnings: "",
      imageId: null,
      showInStore: true,
      stock: 5,
      actualPrice: 12.5,
      autoRecalculate: true,
      values: [{ currencyDocumentId: "cur-1", numberOf: 10 }],
    });
    expect(createAwardRepo).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Arroz",
        active: true,
        showInStore: true,
        stock: 5,
        actualPrice: 12.5,
        autoRecalculate: true,
        prices: [{ currencyId: "cur-1", numberOf: 10 }],
      }),
    );
    expect(resolveAwardPricesOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        autoRecalculate: true,
        actualPrice: 12.5,
        manualPrices: [{ currencyId: "cur-1", numberOf: 10 }],
      }),
      expect.anything(),
    );
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:awards", "default");
    expect(revalidatePath).toHaveBeenCalledWith(
      "/[documentId]/store",
      "layout",
    );
  });

  it("deleteAward archives through repo for manager+", async () => {
    const { deleteAward } = await import("./actions");
    await deleteAward("award-1");
    expect(deleteAwardRepo).toHaveBeenCalledWith("award-1");
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:awards", "default");
  });

  it("permanentlyDeleteAward hard-deletes archived awards only", async () => {
    findAwardById.mockResolvedValue({ id: "award-1", active: false });
    const { permanentlyDeleteAward } = await import("./actions");
    await permanentlyDeleteAward("award-1");
    expect(hardDeleteAward).toHaveBeenCalledWith("award-1");
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:awards", "default");
    expect(revalidatePath).toHaveBeenCalledWith(
      "/[documentId]/store",
      "layout",
    );
  });

  it("permanentlyDeleteAward rejects active awards", async () => {
    findAwardById.mockResolvedValue({ id: "award-1", active: true });
    const { permanentlyDeleteAward } = await import("./actions");
    await expect(permanentlyDeleteAward("award-1")).rejects.toThrow("activeAward");
    expect(hardDeleteAward).not.toHaveBeenCalled();
  });

  it("bulkArchiveAwards archives each selected award", async () => {
    findAwardById.mockResolvedValue({ id: "award-1", active: true });
    const { bulkArchiveAwards } = await import("./actions");
    await bulkArchiveAwards(["award-1", "award-2"]);
    expect(deleteAwardRepo).toHaveBeenCalledTimes(2);
    expect(deleteAwardRepo).toHaveBeenCalledWith("award-1");
    expect(deleteAwardRepo).toHaveBeenCalledWith("award-2");
  });

  it("bulkDeleteAwards hard-deletes archived awards only", async () => {
    findAwardById.mockResolvedValue({ id: "award-1", active: false });
    const { bulkDeleteAwards } = await import("./actions");
    await bulkDeleteAwards(["award-1", "award-2"]);
    expect(hardDeleteAward).toHaveBeenCalledTimes(2);
    expect(hardDeleteAward).toHaveBeenCalledWith("award-1");
    expect(hardDeleteAward).toHaveBeenCalledWith("award-2");
  });

  it("bulkDeleteAwards rejects active awards", async () => {
    findAwardById.mockResolvedValue({ id: "award-1", active: true });
    const { bulkDeleteAwards } = await import("./actions");
    await expect(bulkDeleteAwards(["award-1"])).rejects.toThrow("activeAward");
    expect(hardDeleteAward).not.toHaveBeenCalled();
  });

  it("updateAward updates row and replaces prices", async () => {
    const where = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn().mockReturnValue({ where });
    update.mockReturnValue({ set });

    const { updateAward } = await import("./actions");
    await updateAward("award-1", {
      name: "Feijão",
      title: "Feijão",
      description: "",
      warnings: "",
      imageId: "00000000-0000-4000-8000-000000000001",
      showInStore: false,
      stock: 3,
      actualPrice: 9.99,
      autoRecalculate: false,
      values: [{ currencyDocumentId: "cur-1", numberOf: 5 }],
    });

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Feijão",
        imageMediaId: "00000000-0000-4000-8000-000000000001",
        showInStore: false,
        stock: 3,
        actualPrice: "9.99",
        autoRecalculate: false,
      }),
    );
    expect(set).toHaveBeenCalledWith(
      expect.not.objectContaining({ active: expect.anything() }),
    );
    expect(replaceAwardPrices).toHaveBeenCalledWith(
      "award-1",
      [{ currencyId: "cur-1", numberOf: 5 }],
      expect.anything(),
    );
    expect(resolveAwardPricesOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        autoRecalculate: false,
        actualPrice: 9.99,
        manualPrices: [{ currencyId: "cur-1", numberOf: 5 }],
      }),
      expect.anything(),
    );
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:awards", "default");
    expect(revalidatePath).toHaveBeenCalledWith(
      "/[documentId]/store",
      "layout",
    );
  });

  it("uploadAwardImage stores media and returns the asset record", async () => {
    storeMedia.mockResolvedValue({
      storageKey: "k",
      url: "/media/x.jpg",
      mimeType: "image/jpeg",
      byteSize: 10,
    });
    insertMediaAsset.mockResolvedValue({
      id: "media-new",
      storageKey: "k",
      url: "/media/x.jpg",
      browserUrl: "/media/x.jpg",
      mimeType: "image/jpeg",
      byteSize: 10,
      originalFilename: "a.jpg",
      displayName: null,
      description: null,
      altText: null,
      title: null,
      category: "award",
      sensitivity: "public",
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-01T00:00:00Z"),
    });

    const formData = new FormData();
    formData.append(
      "file",
      new File(["img"], "a.jpg", { type: "image/jpeg" }),
    );

    const { uploadAwardImage } = await import("./actions");
    const asset = await uploadAwardImage(formData);

    expect(storeMedia).toHaveBeenCalled();
    expect(asset.id).toBe("media-new");
  });

  it("listAwardImages returns award-category images", async () => {
    listMediaAssets.mockResolvedValue({
      items: [{ id: "media-1" }],
      total: 1,
    });

    const { listAwardImages } = await import("./actions");
    const items = await listAwardImages();

    expect(listMediaAssets).toHaveBeenCalledWith({
      mimeFilter: "image",
      category: "award",
      includeBiometric: false,
      page: 1,
      pageSize: 100,
    });
    expect(items).toEqual([{ id: "media-1" }]);
  });
});
