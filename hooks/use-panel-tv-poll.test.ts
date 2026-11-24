import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/panels/panel-tv-poll-interval", () => ({
  PANEL_TV_POLL_MS: 1_000,
}));

import { usePanelTvPoll } from "./use-panel-tv-poll";

describe("usePanelTvPoll", () => {
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

  it("polls immediately and on each interval when visible", async () => {
    const onPoll = vi.fn().mockResolvedValue(undefined);
    renderHook(() => usePanelTvPoll(onPoll));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(onPoll).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(onPoll).toHaveBeenCalledTimes(2);
  });
});
