import { describe, expect, it } from "vitest";

import { kioskIdentifySchema } from "./kiosk-identify";

describe("kioskIdentifySchema", () => {
  it("accepts code and password", () => {
    expect(kioskIdentifySchema.parse({ code: 9876, password: "123456" })).toEqual({
      code: 9876,
      password: "123456",
    });
  });
});
