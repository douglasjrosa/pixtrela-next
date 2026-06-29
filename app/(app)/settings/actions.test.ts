import { beforeEach, describe, expect, it, vi } from "vitest";

const strapiFetch = vi.fn();
const revalidateStrapiTags = vi.fn();

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { role: "admin" }, jwt: "jwt" })),
}));

vi.mock("@/lib/strapi", () => ({
  STRAPI_TAGS: {
    currencies: "strapi:currencies",
    kioskSetting: "strapi:kiosk-setting",
  },
  strapiFetch,
}));

vi.mock("@/lib/strapi/revalidate", () => ({
  revalidateStrapiTags,
}));

vi.mock("@/lib/strapi/kiosk-setting", () => ({
  KIOSK_SETTING_API_PATH: "/kiosk-setting",
}));

function mockStrapiFetch(
  handlers: Record<string, unknown>,
): void {
  strapiFetch.mockImplementation(
    async (path: string, init?: { method?: string }) => {
      const method = init?.method ?? "GET";
      const key = `${method} ${path}`;
      if (key in handlers) {
        return handlers[key];
      }
      if (path in handlers) {
        return handlers[path];
      }
      throw new Error(`Unexpected strapiFetch: ${key}`);
    },
  );
}

describe("settings/actions", () => {
  beforeEach(() => {
    strapiFetch.mockReset();
    revalidateStrapiTags.mockReset();
    vi.resetModules();
  });

  it("updateKioskSessionIdleSeconds PUTs singular single-type path", async () => {
    mockStrapiFetch({
      "PUT /kiosk-setting": { data: { sessionIdleSeconds: 15 } },
    });

    const { updateKioskSessionIdleSeconds } = await import("./actions");
    await updateKioskSessionIdleSeconds(15);

    expect(strapiFetch).toHaveBeenCalledWith(
      "/kiosk-setting",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ data: { sessionIdleSeconds: 15 } }),
      }),
    );
    expect(revalidateStrapiTags).toHaveBeenCalledWith("strapi:kiosk-setting");
  });

  it("updateCurrencyPerSecond PUTs collection document path", async () => {
    mockStrapiFetch({
      "GET /currencies": {
        data: [{ documentId: "cur-1", currencyPerSecond: 1 }],
      },
      "PUT /currencies/cur-1": { data: { documentId: "cur-1" } },
    });

    const { updateCurrencyPerSecond } = await import("./actions");
    await updateCurrencyPerSecond(2);

    expect(strapiFetch).toHaveBeenCalledWith(
      "/currencies/cur-1",
      expect.objectContaining({ method: "PUT" }),
    );
    expect(revalidateStrapiTags).toHaveBeenCalledWith("strapi:currencies");
  });
});
