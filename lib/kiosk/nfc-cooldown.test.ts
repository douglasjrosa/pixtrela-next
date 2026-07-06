import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";

import {
  clearNfcWriteCooldown,
  getNfcWriteCooldownRemainingMs,
  isNfcWriteOnCooldown,
  NFC_WRITE_COOLDOWN_MS,
  startNfcWriteCooldown,
  waitForNfcWriteCooldown,
} from "./nfc-cooldown";

describe("nfc write cooldown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearNfcWriteCooldown();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts inactive", () => {
    expect(isNfcWriteOnCooldown()).toBe(false);
    expect(getNfcWriteCooldownRemainingMs()).toBe(0);
  });

  it("blocks writes for the configured duration", () => {
    startNfcWriteCooldown();
    expect(isNfcWriteOnCooldown()).toBe(true);
    expect(getNfcWriteCooldownRemainingMs()).toBe(NFC_WRITE_COOLDOWN_MS);

    vi.advanceTimersByTime(NFC_WRITE_COOLDOWN_MS);
    expect(isNfcWriteOnCooldown()).toBe(false);
  });

  it("waits until cooldown expires", async () => {
    startNfcWriteCooldown(2000);
    const waitPromise = waitForNfcWriteCooldown();
    vi.advanceTimersByTime(2000);
    await waitPromise;
    expect(isNfcWriteOnCooldown()).toBe(false);
  });
});
