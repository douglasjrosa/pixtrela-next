import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
const createAwardRepo = vi.fn();
const replaceAwardPrices = vi.fn();
const getDb = vi.fn();
const storeMedia = vi.fn();

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { role: "admin" }, jwt: "" })),
}));

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
}));

vi.mock("@/lib/repos/awards", () => ({
  createAward: (...args: unknown[]) => createAwardRepo(...args),
  replaceAwardPrices: (...args: unknown[]) => replaceAwardPrices(...args),
}));

const loadAwardListPageMock = vi.fn();

vi.mock("@/lib/awards/load-award-list-page", () => ({
  loadAwardListPage: (...args: unknown[]) => loadAwardListPageMock(...args),
}));

vi.mock("@/lib/db/client", () => ({
  getDb: () => getDb(),
}));

vi.mock("@/lib/media/store-media", () => ({
  storeMedia: (...args: unknown[]) => storeMedia(...args),
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
    createAwardRepo.mockReset();
    replaceAwardPrices.mockReset();
    storeMedia.mockReset();
    loadAwardListPageMock.mockReset();
    getDb.mockReturnValue({ update });
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
    await loadMoreAwards({ column: "title", direction: "asc" }, 2);
    expect(loadAwardListPageMock).toHaveBeenCalledWith(
      { q: undefined, column: "title", direction: "asc" },
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
      active: true,
      stock: 5,
      values: [{ currencyDocumentId: "cur-1", numberOf: 10 }],
    });
    expect(createAwardRepo).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Arroz",
        active: true,
        stock: 5,
        prices: [{ currencyId: "cur-1", numberOf: 10 }],
      }),
    );
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:awards", "default");
  });

  it("deleteAward soft-deactivates the award", async () => {
    const where = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn().mockReturnValue({ where });
    update.mockReturnValue({ set });

    const { deleteAward } = await import("./actions");
    await deleteAward("award-1");

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({ active: false }),
    );
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:awards", "default");
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
      active: false,
      stock: 3,
      values: [{ currencyDocumentId: "cur-1", numberOf: 5 }],
    });

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Feijão",
        imageMediaId: "00000000-0000-4000-8000-000000000001",
        active: false,
        stock: 3,
      }),
    );
    expect(replaceAwardPrices).toHaveBeenCalledWith(
      "award-1",
      [{ currencyId: "cur-1", numberOf: 5 }],
      expect.anything(),
    );
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:awards", "default");
  });

  it("uploadAwardImage stores media and returns drizzle id", async () => {
    storeMedia.mockResolvedValue({
      storageKey: "k",
      url: "/media/x.jpg",
      mimeType: "image/jpeg",
      byteSize: 10,
    });
    const returning = vi.fn().mockResolvedValue([{ id: "media-new" }]);
    const values = vi.fn().mockReturnValue({ returning });
    const insert = vi.fn().mockReturnValue({ values });
    getDb.mockReturnValue({ update, insert });

    const formData = new FormData();
    formData.append(
      "file",
      new File(["img"], "a.jpg", { type: "image/jpeg" }),
    );

    const { uploadAwardImage } = await import("./actions");
    const id = await uploadAwardImage(formData);

    expect(storeMedia).toHaveBeenCalled();
    expect(id).toBe("media-new");
  });
});
