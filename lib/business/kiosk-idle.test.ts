import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  KIOSK_IDLE_MS,
  computeIdleProgress,
  createKioskIdleController,
  createKioskIdleTimer,
} from "./kiosk-idle";

describe("computeIdleProgress", () => {
  it("returns zero at start and one when deadline passed", () => {
    const deadline = 10_000;
    expect(computeIdleProgress(deadline, 0, 10_000)).toBe(0);
    expect(computeIdleProgress(deadline, 10_000, 10_000)).toBe(1);
    expect(computeIdleProgress(deadline, 11_000, 10_000)).toBe(1);
  });

  it("returns halfway at midpoint", () => {
    expect(computeIdleProgress(10_000, 5_000, 10_000)).toBe(0.5);
  });
});

describe("createKioskIdleController", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fires callback and reports full progress after idle period", () => {
    const onIdle = vi.fn();
    const onProgress = vi.fn();
    const timer = createKioskIdleController({
      durationMs: KIOSK_IDLE_MS,
      onIdle,
      onProgress,
      tickMs: 100,
    });

    timer.reset();
    expect(onProgress).toHaveBeenCalledWith(0);

    vi.advanceTimersByTime(KIOSK_IDLE_MS);
    expect(onIdle).toHaveBeenCalledOnce();
    expect(onProgress).toHaveBeenLastCalledWith(1);
    timer.clear();
  });

  it("resets timer on activity", () => {
    const onIdle = vi.fn();
    const timer = createKioskIdleController({
      durationMs: KIOSK_IDLE_MS,
      onIdle,
    });

    timer.reset();
    vi.advanceTimersByTime(KIOSK_IDLE_MS - 1000);
    timer.reset();
    vi.advanceTimersByTime(KIOSK_IDLE_MS - 1000);
    expect(onIdle).not.toHaveBeenCalled();
    timer.clear();
  });
});

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
});
