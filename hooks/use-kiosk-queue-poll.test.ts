import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/kiosk/kiosk-queue-poll-interval", () => ({
  KIOSK_QUEUE_POLL_MS: 1_000,
}));

import { useKioskQueuePoll } from "./use-kiosk-queue-poll";

describe("useKioskQueuePoll", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("polls immediately and on each interval when active", async () => {
    const onPoll = vi.fn().mockResolvedValue(undefined);
    renderHook(() => useKioskQueuePoll(onPoll, false));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(onPoll).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(onPoll).toHaveBeenCalledTimes(2);
  });

  it("does not poll while paused", async () => {
    const onPoll = vi.fn().mockResolvedValue(undefined);
    renderHook(() => useKioskQueuePoll(onPoll, true));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });
    expect(onPoll).not.toHaveBeenCalled();
  });

  it("skips polls while the document is hidden", async () => {
    const onPoll = vi.fn().mockResolvedValue(undefined);
    renderHook(() => useKioskQueuePoll(onPoll, false));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(onPoll).toHaveBeenCalledTimes(1);
    onPoll.mockClear();

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(onPoll).not.toHaveBeenCalled();
  });
});
