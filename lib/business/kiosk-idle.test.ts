import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { KIOSK_IDLE_MS, createKioskIdleTimer } from "./kiosk-idle";

describe("createKioskIdleTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fires callback after idle period", () => {
    const onIdle = vi.fn();
    const timer = createKioskIdleTimer(onIdle);
    timer.reset();
    vi.advanceTimersByTime(KIOSK_IDLE_MS);
    expect(onIdle).toHaveBeenCalledOnce();
    timer.clear();
  });

  it("resets timer on activity", () => {
    const onIdle = vi.fn();
    const timer = createKioskIdleTimer(onIdle);
    timer.reset();
    vi.advanceTimersByTime(KIOSK_IDLE_MS - 1000);
    timer.reset();
    vi.advanceTimersByTime(KIOSK_IDLE_MS - 1000);
    expect(onIdle).not.toHaveBeenCalled();
    timer.clear();
  });
});
