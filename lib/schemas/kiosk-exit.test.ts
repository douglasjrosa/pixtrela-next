import { describe, expect, it } from "vitest";

import { parseKioskExitInput, toActivityStopPayload } from "./kiosk-exit";

describe("parseKioskExitInput", () => {
  it("parses duration exit with completion flag", () => {
    expect(
      parseKioskExitInput("duration", {
        sharingType: "duration",
        isCompleted: true,
      }),
    ).toEqual({ sharingType: "duration", isCompleted: true });
  });

  it("parses qty exit with completed pieces within max", () => {
    expect(
      parseKioskExitInput(
        "qty",
        { sharingType: "qty", qtyCompleted: 3 },
        { maxQty: 5 },
      ),
    ).toEqual({ sharingType: "qty", qtyCompleted: 3 });
  });

  it("rejects qty above remaining pieces", () => {
    expect(() =>
      parseKioskExitInput(
        "qty",
        { sharingType: "qty", qtyCompleted: 6 },
        { maxQty: 5 },
      ),
    ).toThrow();
  });
});

describe("toActivityStopPayload", () => {
  it("maps duration exit to completed flag", () => {
    expect(
      toActivityStopPayload({ sharingType: "duration", isCompleted: false }),
    ).toEqual({ completed: false });
  });

  it("maps qty exit to qty", () => {
    expect(
      toActivityStopPayload({ sharingType: "qty", qtyCompleted: 5 }),
    ).toEqual({ qty: 5 });
  });
});
