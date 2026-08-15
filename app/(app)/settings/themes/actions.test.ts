import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
const revalidatePath = vi.fn();
const updateRouteThemeRepo = vi.fn();
const storeMedia = vi.fn();
const getDb = vi.fn();

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { role: "admin" }, jwt: "" })),
}));

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

vi.mock("@/lib/repos/settings", () => ({
  updateRouteTheme: (...args: unknown[]) => updateRouteThemeRepo(...args),
}));

vi.mock("@/lib/media/store-media", () => ({
  storeMedia: (...args: unknown[]) => storeMedia(...args),
}));

vi.mock("@/lib/db/client", () => ({
  getDb: () => getDb(),
}));

describe("settings/themes/actions drizzle paths", () => {
  beforeEach(() => {
    vi.resetModules();
    revalidateTag.mockReset();
    updateRouteThemeRepo.mockReset();
    storeMedia.mockReset();
  });

  it("updateRouteTheme persists via repo and revalidates", async () => {
    const { updateRouteTheme } = await import("./actions");
    await updateRouteTheme("theme-1", {
      backgroundColor: "#112233",
      clearBackgroundImage: true,
    });
    expect(updateRouteThemeRepo).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "theme-1",
        backgroundColor: "#112233",
        clearBackgroundImage: true,
      }),
    );
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:route-themes", "default");
  });

  it("uploadRouteThemeImage stores media and returns id", async () => {
    storeMedia.mockResolvedValue({
      storageKey: "k",
      url: "/bg.jpg",
      mimeType: "image/jpeg",
      byteSize: 12,
    });
    const returning = vi.fn().mockResolvedValue([{ id: "bg-media" }]);
    const values = vi.fn().mockReturnValue({ returning });
    const insert = vi.fn().mockReturnValue({ values });
    getDb.mockReturnValue({ insert });

    const formData = new FormData();
    formData.append(
      "file",
      new File(["x"], "bg.jpg", { type: "image/jpeg" }),
    );

    const { uploadRouteThemeImage } = await import("./actions");
    const id = await uploadRouteThemeImage(formData);
    expect(id).toBe("bg-media");
    expect(storeMedia).toHaveBeenCalled();
  });
});
