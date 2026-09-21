import { describe, expect, it } from "vitest";

import { kioskActionErrorMessage } from "./kiosk-action-error";

function t(key: string): string {
  return `msg:${key}`;
}

describe("kioskActionErrorMessage", () => {
  it("maps known start codes instead of the generic fallback", () => {
    expect(
      kioskActionErrorMessage(t, new Error("atWorkerCapacity"), "startFailed"),
    ).toBe("msg:atWorkerCapacity");
    expect(
      kioskActionErrorMessage(t, new Error("subTaskLocked"), "startFailed"),
    ).toBe("msg:subTaskLocked");
    expect(
      kioskActionErrorMessage(t, new Error("chainNotJoinable"), "startFailed"),
    ).toBe("msg:chainNotJoinable");
  });

  it("maps known exit codes instead of the generic fallback", () => {
    expect(
      kioskActionErrorMessage(t, new Error("noOpenSession"), "exitFailed"),
    ).toBe("msg:noOpenSession");
    expect(
      kioskActionErrorMessage(t, new Error("flagsRequired"), "exitFailed"),
    ).toBe("msg:flagsRequired");
  });

  it("falls back when the error code is unknown", () => {
    expect(
      kioskActionErrorMessage(t, new Error("forbidden"), "startFailed"),
    ).toBe("msg:startFailed");
    expect(kioskActionErrorMessage(t, "nope", "exitFailed")).toBe(
      "msg:exitFailed",
    );
  });
});
