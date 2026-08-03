import { describe, expect, it } from "vitest";

import { kioskTagIdentifySchema } from "./kiosk-tag-identify";

describe("kioskTagIdentifySchema", () => {
  it("normalizes a valid tag", () => {
    expect(kioskTagIdentifySchema.parse({ userTag: "04:a3:b2:c1" })).toEqual({
      userTag: "04A3B2C1",
    });
  });

  it("rejects short tags", () => {
    expect(kioskTagIdentifySchema.safeParse({ userTag: "AB" }).success).toBe(
      false,
    );
  });
});
