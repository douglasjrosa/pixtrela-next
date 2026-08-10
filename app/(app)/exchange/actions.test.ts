import { beforeEach, describe, expect, it, vi } from "vitest";

const strapiFetch = vi.fn();
const revalidateStrapiTags = vi.fn();

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({
    user: { id: "col-1", role: "colaborator" },
    jwt: "jwt",
  })),
}));

vi.mock("@/lib/strapi", () => ({
  STRAPI_TAGS: {
    exchanges: "strapi:exchanges",
    awards: "strapi:awards",
  },
  balanceTag: (userId: string) => `strapi:balances:${userId}`,
  strapiFetch,
}));

vi.mock("@/lib/strapi/revalidate", () => ({
  revalidateStrapiTags,
}));

vi.mock("@/lib/db/backend", () => ({
  isDrizzleBackend: () => false,
}));

describe("exchange/actions", () => {
  beforeEach(() => {
    strapiFetch.mockReset();
    revalidateStrapiTags.mockReset();
    vi.resetModules();
  });

  it("redeemAward POSTs awardId, currency and qty then revalidates tags", async () => {
    strapiFetch.mockResolvedValue({ data: { documentId: "ex-1" } });
    const { redeemAward } = await import("./actions");

    await redeemAward("award-1", "star", 1);

    expect(strapiFetch).toHaveBeenCalledWith(
      "/exchanges",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          data: { awardId: "award-1", currency: "star", qty: 1 },
        }),
      }),
    );
    expect(revalidateStrapiTags).toHaveBeenCalledWith(
      "strapi:exchanges",
      "strapi:awards",
      "strapi:balances:col-1",
    );
  });
});
