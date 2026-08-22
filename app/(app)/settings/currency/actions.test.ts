import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
const revalidatePath = vi.fn();
const createCurrencyRepo = vi.fn();
const listCurrenciesRepo = vi.fn();
const archiveCurrencyRepo = vi.fn();
const hardDeleteCurrencyRepo = vi.fn();
const findCurrencyById = vi.fn();
const getCurrencyForSubtasks = vi.fn();
const upsertCurrencyForSubtasks = vi.fn();
const getDb = vi.fn();
const storeMedia = vi.fn();

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { role: "admin" }, jwt: "" })),
}));

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

vi.mock("@/lib/repos/awards", () => ({
  createCurrency: (...args: unknown[]) => createCurrencyRepo(...args),
  listCurrencies: (...args: unknown[]) => listCurrenciesRepo(...args),
  archiveCurrency: (...args: unknown[]) => archiveCurrencyRepo(...args),
  hardDeleteCurrency: (...args: unknown[]) => hardDeleteCurrencyRepo(...args),
  findCurrencyById: (...args: unknown[]) => findCurrencyById(...args),
}));

vi.mock("@/lib/repos/settings", () => ({
  getCurrencyForSubtasks: (...args: unknown[]) => getCurrencyForSubtasks(...args),
  upsertCurrencyForSubtasks: (...args: unknown[]) =>
    upsertCurrencyForSubtasks(...args),
}));

vi.mock("@/lib/db/client", () => ({
  getDb: () => getDb(),
}));

vi.mock("@/lib/media/store-media", () => ({
  storeMedia: (...args: unknown[]) => storeMedia(...args),
}));

describe("settings/currency/actions drizzle CRUD", () => {
  const where = vi.fn().mockResolvedValue(undefined);
  const set = vi.fn().mockReturnValue({ where });
  const update = vi.fn().mockReturnValue({ set });
  const deleteFn = vi.fn().mockReturnValue({ where });

  beforeEach(() => {
    vi.resetModules();
    revalidateTag.mockReset();
    revalidatePath.mockReset();
    createCurrencyRepo.mockReset();
    listCurrenciesRepo.mockReset();
    archiveCurrencyRepo.mockReset();
    hardDeleteCurrencyRepo.mockReset();
    findCurrencyById.mockReset();
    getCurrencyForSubtasks.mockReset();
    upsertCurrencyForSubtasks.mockReset();
    storeMedia.mockReset();
    getDb.mockReturnValue({ delete: deleteFn, update });
    deleteFn.mockClear();
    where.mockClear();
    set.mockClear();
    update.mockClear();
  });

  it("createCurrency uses repo", async () => {
    createCurrencyRepo.mockResolvedValue({ id: "cur-1" });
    const { createCurrency } = await import("./actions");
    await createCurrency({
      name: "Estrela",
      title: "Estrela",
      pluralTitle: "Estrelas",
      currencyPerSecond: 1,
      iconMediaId: null,
    });
    expect(createCurrencyRepo).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Estrela",
        currencyPerSecond: 1,
      }),
    );
  });

  it("deleteCurrency rejects the assigned subtasks currency", async () => {
    listCurrenciesRepo.mockResolvedValue([
      { id: "cur-star", active: true },
      { id: "cur-gem", active: true },
    ]);
    getCurrencyForSubtasks.mockResolvedValue({ currencyId: "cur-star" });
    const { deleteCurrency } = await import("./actions");
    await expect(deleteCurrency("cur-star")).rejects.toThrow(
      "primaryCurrencyProtected",
    );
    expect(hardDeleteCurrencyRepo).not.toHaveBeenCalled();
  });

  it("deleteCurrency allows the first-listed currency after another is assigned", async () => {
    listCurrenciesRepo.mockResolvedValue([
      { id: "cur-star", active: true },
      { id: "cur-gem", active: true },
    ]);
    getCurrencyForSubtasks.mockResolvedValue({ currencyId: "cur-gem" });
    const { deleteCurrency } = await import("./actions");
    await deleteCurrency("cur-star");
    expect(hardDeleteCurrencyRepo).toHaveBeenCalledWith("cur-star");
    expect(upsertCurrencyForSubtasks).not.toHaveBeenCalled();
  });

  it("bulkArchiveCurrencies archives non-primary currencies", async () => {
    listCurrenciesRepo.mockResolvedValue([
      { id: "cur-star", active: true },
      { id: "cur-gem", active: true },
    ]);
    getCurrencyForSubtasks.mockResolvedValue({ currencyId: "cur-star" });
    const { bulkArchiveCurrencies } = await import("./actions");
    await bulkArchiveCurrencies(["cur-star", "cur-gem"]);
    expect(archiveCurrencyRepo).toHaveBeenCalledWith("cur-gem");
    expect(archiveCurrencyRepo).not.toHaveBeenCalledWith("cur-star");
  });

  it("bulkDeleteCurrencies rejects an active currency", async () => {
    listCurrenciesRepo.mockResolvedValue([
      { id: "cur-star", active: true },
      { id: "cur-gem", active: true },
    ]);
    findCurrencyById.mockResolvedValue({ id: "cur-gem", active: true });
    const { bulkDeleteCurrencies } = await import("./actions");
    await expect(bulkDeleteCurrencies(["cur-gem"])).rejects.toThrow(
      "activeCurrency",
    );
    expect(hardDeleteCurrencyRepo).not.toHaveBeenCalled();
  });

  it("bulkDeleteCurrencies hard-deletes archived currencies", async () => {
    listCurrenciesRepo.mockResolvedValue([
      { id: "cur-star", active: true },
      { id: "cur-gem", active: false },
    ]);
    findCurrencyById.mockResolvedValue({ id: "cur-gem", active: false });
    getCurrencyForSubtasks.mockResolvedValue({ currencyId: "cur-star" });
    const { bulkDeleteCurrencies } = await import("./actions");
    await bulkDeleteCurrencies(["cur-gem"]);
    expect(hardDeleteCurrencyRepo).toHaveBeenCalledWith("cur-gem");
  });

  it("updateCurrency patches row including icon uuid", async () => {
    const { updateCurrency } = await import("./actions");
    await updateCurrency("cur-1", {
      name: "Estrela",
      title: "Estrela",
      pluralTitle: "Estrelas",
      currencyPerSecond: 2,
      iconMediaId: "00000000-0000-4000-8000-000000000002",
    });
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Estrela",
        iconMediaId: "00000000-0000-4000-8000-000000000002",
        currencyPerSecond: 2,
      }),
    );
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:currencies", "default");
  });

  it("uploadCurrencyIcon stores media and returns id", async () => {
    storeMedia.mockResolvedValue({
      storageKey: "k",
      url: "/media/icon.png",
      mimeType: "image/png",
      byteSize: 8,
    });
    const returning = vi.fn().mockResolvedValue([{ id: "icon-uuid" }]);
    const values = vi.fn().mockReturnValue({ returning });
    const insert = vi.fn().mockReturnValue({ values });
    getDb.mockReturnValue({ delete: deleteFn, update, insert });

    const formData = new FormData();
    formData.append(
      "file",
      new File(["x"], "icon.png", { type: "image/png" }),
    );

    const { uploadCurrencyIcon } = await import("./actions");
    const id = await uploadCurrencyIcon(formData);
    expect(id).toBe("icon-uuid");
    expect(storeMedia).toHaveBeenCalled();
  });
});
