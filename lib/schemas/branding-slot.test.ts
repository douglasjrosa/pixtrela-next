import { describe, expect, it } from "vitest";

import { brandingSlotUpsertSchema } from "./branding-slot";

describe("brandingSlotUpsertSchema", () => {
  it("accepts menu logo background updates", () => {
    const result = brandingSlotUpsertSchema.safeParse({
      key: "menu_logo",
      config: {
        backgroundColor: "#112233",
        backgroundColorOpacity: 25,
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects display fields on ranking slots", () => {
    const result = brandingSlotUpsertSchema.safeParse({
      key: "ranking_first",
      config: { displayOpacity: 50 },
    });
    expect(result.success).toBe(false);
  });

  it("accepts cart watermark display config", () => {
    const result = brandingSlotUpsertSchema.safeParse({
      key: "cart_watermark",
      mediaId: "11111111-1111-4111-8111-111111111111",
      config: {
        backgroundColor: "#ffffff",
        backgroundColorOpacity: 10,
        displayOpacity: 80,
        widthPercent: 60,
      },
    });
    expect(result.success).toBe(true);
  });
});
