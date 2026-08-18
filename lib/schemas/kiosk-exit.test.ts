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

  it("parses optional flagIds on duration exit", () => {
    expect(
      parseKioskExitInput("duration", {
        sharingType: "duration",
        isCompleted: true,
        flagIds: ["flag-1"],
      }),
    ).toEqual({
      sharingType: "duration",
      isCompleted: true,
      flagIds: ["flag-1"],
    });
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

  it("accepts zero completed pieces", () => {
    expect(
      parseKioskExitInput(
        "qty",
        { sharingType: "qty", qtyCompleted: 0 },
        { maxQty: 5 },
      ),
    ).toEqual({ sharingType: "qty", qtyCompleted: 0 });
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

  it("includes flagIds in the stop payload when present", () => {
    expect(
      toActivityStopPayload({
        sharingType: "duration",
        isCompleted: true,
        flagIds: ["flag-1"],
      }),
    ).toEqual({ completed: true, flagIds: ["flag-1"] });
  });
});
