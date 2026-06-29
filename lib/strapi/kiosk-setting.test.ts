import { beforeEach, describe, expect, it, vi } from "vitest";

const { strapiFetch } = vi.hoisted(() => ({
  strapiFetch: vi.fn(),
}));

vi.mock("@/lib/strapi", () => ({
  STRAPI_TAGS: { kioskSetting: "strapi:kiosk-setting" },
  strapiFetch,
}));

import {
  KIOSK_SETTING_API_PATH,
  loadKioskSessionIdleSeconds,
} from "./kiosk-setting";

describe("kiosk-setting strapi loader", () => {
  beforeEach(() => {
    strapiFetch.mockReset();
  });

  it("loads sessionIdleSeconds from singular single-type path", async () => {
    strapiFetch.mockResolvedValue({ data: { sessionIdleSeconds: 12 } });

    const seconds = await loadKioskSessionIdleSeconds();

    expect(seconds).toBe(12);
    expect(strapiFetch).toHaveBeenCalledWith(
      KIOSK_SETTING_API_PATH,
      expect.objectContaining({
        strapiCache: { tags: ["strapi:kiosk-setting"], revalidate: 60 },
      }),
      { fields: ["sessionIdleSeconds"] },
    );
  });

  it("falls back to default when fetch fails", async () => {
    strapiFetch.mockRejectedValue(new Error("network"));

    const seconds = await loadKioskSessionIdleSeconds();

    expect(seconds).toBe(7);
  });
});
