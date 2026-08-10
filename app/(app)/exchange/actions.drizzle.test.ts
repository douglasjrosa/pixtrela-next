import { beforeEach, describe, expect, it, vi } from "vitest";

const redeemAwardRepo = vi.fn();
const isDrizzleBackend = vi.fn(() => true);
const revalidateTag = vi.fn();

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({
    user: { id: "col-1", role: "colaborator" },
    jwt: "jwt",
  })),
}));

vi.mock("@/lib/db/backend", () => ({
  isDrizzleBackend: () => isDrizzleBackend(),
}));

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
}));

vi.mock("@/lib/repos/exchanges", () => ({
  redeemAward: (...args: unknown[]) => redeemAwardRepo(...args),
}));

vi.mock("@/lib/strapi", () => ({
  STRAPI_TAGS: {
    exchanges: "strapi:exchanges",
    awards: "strapi:awards",
  },
  balanceTag: (userId: string) => `strapi:balances:${userId}`,
  strapiFetch: vi.fn(),
}));

vi.mock("@/lib/strapi/revalidate", () => ({
  revalidateStrapiTags: vi.fn(),
}));

describe("exchange/actions drizzle", () => {
  beforeEach(() => {
    vi.resetModules();
    isDrizzleBackend.mockReturnValue(true);
    redeemAwardRepo.mockReset();
    revalidateTag.mockReset();
    redeemAwardRepo.mockResolvedValue({ exchangeId: "ex-1" });
  });

  it("redeemAward uses drizzle repo and revalidateTag", async () => {
    const { redeemAward } = await import("./actions");
    await redeemAward("award-1", "currency-star", 2);

    expect(redeemAwardRepo).toHaveBeenCalledWith({
      userId: "col-1",
      awardId: "award-1",
      currencyId: "currency-star",
      qty: 2,
    });
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:exchanges");
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:balances");
  });
});
