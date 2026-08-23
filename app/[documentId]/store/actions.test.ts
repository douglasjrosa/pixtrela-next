import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
const revalidatePath = vi.fn();
const addCartItem = vi.fn();
const setCartItemQty = vi.fn();
const removeCartItem = vi.fn();

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
  setCartItemQty: (...args: unknown[]) => setCartItemQty(...args),
  removeCartItem: (...args: unknown[]) => removeCartItem(...args),
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
    setCartItemQty.mockReset();
    removeCartItem.mockReset();
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

  it("updateCartItemQty revalidates store layout and catalog tags", async () => {
    setCartItemQty.mockResolvedValueOnce(undefined);
    const { updateCartItemQty } = await import("./actions");
    const formData = new FormData();
    formData.set("itemId", "item-1");
    formData.set("qty", "3");

    const result = await updateCartItemQty({ ok: false }, formData);

    expect(result).toEqual({ ok: true });
    expect(setCartItemQty).toHaveBeenCalledWith({
      userId: "col-1",
      itemId: "item-1",
      qty: 3,
    });
    expectStoreRevalidation();
  });

  it("removeCartItemAction revalidates store layout and catalog tags", async () => {
    removeCartItem.mockResolvedValueOnce(undefined);
    const { removeCartItemAction } = await import("./actions");
    const formData = new FormData();
    formData.set("itemId", "item-1");

    const result = await removeCartItemAction({ ok: false }, formData);

    expect(result).toEqual({ ok: true });
    expect(removeCartItem).toHaveBeenCalledWith({
      userId: "col-1",
      itemId: "item-1",
    });
    expectStoreRevalidation();
  });
});
