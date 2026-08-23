import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
const revalidatePath = vi.fn();
const addCartItem = vi.fn();
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
  addCartItem: (...args: unknown[]) => addCartItem(...args),
  syncOpenCartDraft: (...args: unknown[]) => syncOpenCartDraft(...args),
}));

function expectStoreRevalidation(): void {
  expect(revalidateTag).toHaveBeenCalledWith("drizzle:carts", "default");
  expect(revalidateTag).toHaveBeenCalledWith("drizzle:awards", "default");
  expect(revalidatePath).toHaveBeenCalledWith("/[documentId]/store", "layout");
}

describe("store/cart actions", () => {
  beforeEach(() => {
    vi.resetModules();
    revalidateTag.mockReset();
    revalidatePath.mockReset();
    addCartItem.mockReset();
    syncOpenCartDraft.mockReset();
  });

  it("addToCart revalidates store layout and catalog tags", async () => {
    addCartItem.mockResolvedValueOnce({ cartId: "cart-1", itemId: "item-1", qty: 1 });
    const { addToCart } = await import("./actions");
    const formData = new FormData();
    formData.set("awardId", "award-1");
    formData.set("qty", "2");

    const result = await addToCart({ ok: false }, formData);

    expect(result).toEqual({ ok: true, messageKey: "addedToCart" });
    expect(addCartItem).toHaveBeenCalledWith({
      userId: "col-1",
      awardId: "award-1",
      qty: 2,
    });
    expectStoreRevalidation();
  });

  it("saveCartDraft syncs draft and revalidates store layout", async () => {
    syncOpenCartDraft.mockResolvedValueOnce(undefined);
    const { saveCartDraft } = await import("./actions");
    const formData = new FormData();
    formData.set(
      "payload",
      JSON.stringify({
        items: [
          {
            itemId: "11111111-1111-4111-8111-111111111111",
            qty: 3,
          },
        ],
      }),
    );

    const result = await saveCartDraft({ ok: false }, formData);

    expect(result).toEqual({ ok: true });
    expect(syncOpenCartDraft).toHaveBeenCalledWith({
      userId: "col-1",
      items: [{ itemId: "11111111-1111-4111-8111-111111111111", qty: 3 }],
    });
    expectStoreRevalidation();
  });
});
