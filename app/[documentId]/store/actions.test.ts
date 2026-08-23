import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
const revalidatePath = vi.fn();
const syncOpenCartDraft = vi.fn();

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({
    user: { id: "col-1", role: "colaborator" },
  })),
}));

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

vi.mock("@/lib/repos/carts", () => ({
  syncOpenCartDraft: (...args: unknown[]) => syncOpenCartDraft(...args),
}));

function expectStoreRevalidation(): void {
  expect(revalidateTag).toHaveBeenCalledWith("drizzle:carts", "default");
  expect(revalidateTag).toHaveBeenCalledWith("drizzle:awards", "default");
  expect(revalidatePath).toHaveBeenCalledWith("/[documentId]/store", "layout");
}

describe("store cart draft actions", () => {
  beforeEach(() => {
    vi.resetModules();
    revalidateTag.mockReset();
    revalidatePath.mockReset();
    syncOpenCartDraft.mockReset();
  });

  it("saveCartDraft syncs award quantities and revalidates store layout", async () => {
    syncOpenCartDraft.mockResolvedValueOnce(undefined);
    const { saveCartDraft } = await import("./actions");
    const formData = new FormData();
    formData.set(
      "payload",
      JSON.stringify({
        items: [
          {
            awardId: "11111111-1111-4111-8111-111111111111",
            qty: 3,
          },
          {
            awardId: "22222222-2222-4222-8222-222222222222",
            qty: 0,
          },
        ],
      }),
    );

    const result = await saveCartDraft({ ok: false }, formData);

    expect(result).toEqual({ ok: true });
    expect(syncOpenCartDraft).toHaveBeenCalledWith({
      userId: "col-1",
      items: [
        { awardId: "11111111-1111-4111-8111-111111111111", qty: 3 },
        { awardId: "22222222-2222-4222-8222-222222222222", qty: 0 },
      ],
    });
    expectStoreRevalidation();
  });
});
