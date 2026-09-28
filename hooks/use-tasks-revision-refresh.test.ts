import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pollTasksRevision = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/app/(app)/tasks/poll-revision", () => ({
  pollTasksRevision: (...args: unknown[]) => pollTasksRevision(...args),
}));

import { useTasksRevisionRefresh } from "./use-tasks-revision-refresh";

const TASKS_REVISION_POLL_MS = 10_000;

const REVISION = {
  count: 1,
  maxUpdatedAt: "2026-01-01T00:00:00.000Z",
};

describe("useTasksRevisionRefresh", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    pollTasksRevision.mockReset();
    pollTasksRevision.mockResolvedValue(REVISION);
    refresh.mockReset();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("polls only while the tab is visible", async () => {
    renderHook(() => useTasksRevisionRefresh());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(pollTasksRevision).toHaveBeenCalledTimes(1);

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    });
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
      await vi.advanceTimersByTimeAsync(TASKS_REVISION_POLL_MS * 3);
    });
    expect(pollTasksRevision).toHaveBeenCalledTimes(1);

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(pollTasksRevision).toHaveBeenCalledTimes(2);
  });
});
