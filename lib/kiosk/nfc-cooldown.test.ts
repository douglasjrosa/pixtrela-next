import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";

import {
  clearNfcCooldown,
  getNfcCooldownRemainingMs,
  isNfcOnCooldown,
  NFC_COOLDOWN_MS,
  startNfcCooldown,
  waitForNfcCooldown,
} from "./nfc-cooldown";

describe("nfc cooldown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearNfcCooldown();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts inactive", () => {
    expect(isNfcOnCooldown()).toBe(false);
    expect(getNfcCooldownRemainingMs()).toBe(0);
  });

  it("blocks for the configured duration", () => {
    startNfcCooldown();
    expect(isNfcOnCooldown()).toBe(true);
    expect(getNfcCooldownRemainingMs()).toBe(NFC_COOLDOWN_MS);

    vi.advanceTimersByTime(NFC_COOLDOWN_MS);
    expect(isNfcOnCooldown()).toBe(false);
  });

  it("waits until cooldown expires", async () => {
    startNfcCooldown(2000);
    const waitPromise = waitForNfcCooldown();
    vi.advanceTimersByTime(2000);
    await waitPromise;
    expect(isNfcOnCooldown()).toBe(false);
  });
});
