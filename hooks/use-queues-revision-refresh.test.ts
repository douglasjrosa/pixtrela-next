import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BOARD_INVALIDATE_EVENT } from "@/lib/realtime/board-channel";

import {
  QUEUES_REVISION_POLL_MS,
  QUEUES_REVISION_SSE_FALLBACK_MS,
  useQueuesRevisionRefresh,
} from "./use-queues-revision-refresh";

const pollBoardRevision = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/app/(app)/board/poll-revision", () => ({
  pollBoardRevision: (...args: unknown[]) => pollBoardRevision(...args),
}));

const REVISION = {
  activeTaskCount: 1,
  tasksMaxUpdatedAt: null,
  subTasksMaxUpdatedAt: null,
  activitiesMaxTimestamp: "2026-01-01T00:00:00.000Z",
  assigneeCount: 0,
  stepsMaxUpdatedAt: null,
};

const NEXT_REVISION = {
  ...REVISION,
  activitiesMaxTimestamp: "2026-01-01T00:01:00.000Z",
};

class FakeEventSource {
  static last: FakeEventSource | null = null;
  url: string;
  closed = false;
  onerror: (() => void) | null = null;
  onopen: (() => void) | null = null;
  private listeners = new Map<string, Array<() => void>>();

  constructor(url: string) {
    this.url = url;
    FakeEventSource.last = this;
  }

  addEventListener(type: string, listener: () => void): void {
    const list = this.listeners.get(type) ?? [];
    list.push(listener);
    this.listeners.set(type, list);
  }

  close(): void {
    this.closed = true;
  }

  emit(type: string): void {
    const list = this.listeners.get(type) ?? [];
    for (const listener of list) listener();
  }
}

async function flushMount(): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

describe("useQueuesRevisionRefresh", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    pollBoardRevision.mockReset();
    pollBoardRevision.mockResolvedValue(REVISION);
    refresh.mockReset();
    FakeEventSource.last = null;
    vi.stubGlobal("EventSource", FakeEventSource);
    vi.stubEnv("NEXT_PUBLIC_REALTIME_SSE_URL", "");
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("keeps a 10s interval when the public SSE URL is missing", async () => {
    renderHook(() => useQueuesRevisionRefresh());
    await flushMount();
    expect(pollBoardRevision).toHaveBeenCalledTimes(1);
    expect(refresh).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(QUEUES_REVISION_POLL_MS);
    });
    expect(pollBoardRevision).toHaveBeenCalledTimes(2);
    expect(FakeEventSource.last).toBeNull();
  });

  it("refreshes the route when the board revision changes", async () => {
    pollBoardRevision
      .mockResolvedValueOnce(REVISION)
      .mockResolvedValueOnce(NEXT_REVISION);

    renderHook(() => useQueuesRevisionRefresh());
    await flushMount();
    expect(refresh).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(QUEUES_REVISION_POLL_MS);
    });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("runs checkRevision when the hub emits board-invalidate", async () => {
    vi.stubEnv("NEXT_PUBLIC_REALTIME_SSE_URL", "https://sse.example");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          sseUrl: "https://sse.example",
          token: "signed-token",
        }),
      }),
    );

    renderHook(() => useQueuesRevisionRefresh());
    await flushMount();

    expect(pollBoardRevision).toHaveBeenCalledTimes(1);
    expect(FakeEventSource.last?.url).toContain(
      "/events/board?token=signed-token",
    );

    await act(async () => {
      FakeEventSource.last?.emit(BOARD_INVALIDATE_EVENT);
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(pollBoardRevision).toHaveBeenCalledTimes(2);
  });

  it("slows the poll to 60s while the EventSource is open", async () => {
    vi.stubEnv("NEXT_PUBLIC_REALTIME_SSE_URL", "https://sse.example");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          sseUrl: "https://sse.example",
          token: "signed-token",
        }),
      }),
    );

    renderHook(() => useQueuesRevisionRefresh());
    await flushMount();
    FakeEventSource.last?.onopen?.();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(QUEUES_REVISION_POLL_MS);
    });
    expect(pollBoardRevision).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(QUEUES_REVISION_SSE_FALLBACK_MS);
    });
    expect(pollBoardRevision).toHaveBeenCalledTimes(2);
  });

  it("closes the EventSource while the tab is hidden", async () => {
    vi.stubEnv("NEXT_PUBLIC_REALTIME_SSE_URL", "https://sse.example");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          sseUrl: "https://sse.example",
          token: "signed-token",
        }),
      }),
    );

    renderHook(() => useQueuesRevisionRefresh());
    await flushMount();
    const source = FakeEventSource.last;
    expect(source?.closed).toBe(false);

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    });
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(source?.closed).toBe(true);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(QUEUES_REVISION_POLL_MS);
    });
    expect(pollBoardRevision).toHaveBeenCalledTimes(1);
    expect(FakeEventSource.last).toBe(source);
  });
});
