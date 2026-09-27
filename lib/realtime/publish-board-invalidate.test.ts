import { after } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BOARD_REALTIME_CHANNEL } from "@/lib/realtime/board-channel";
import {
  publishBoardInvalidate,
  scheduleBoardInvalidate,
} from "@/lib/realtime/publish-board-invalidate";

vi.mock("next/server", () => ({
  after: vi.fn((task: () => void | Promise<void>) => {
    void task();
  }),
}));

const PUBLISH_URL = "https://hub.example/internal/publish";

describe("publishBoardInvalidate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.mocked(after).mockClear();
  });

  it("is a no-op when REALTIME_PUBLISH_URL is empty", async () => {
    vi.stubEnv("REALTIME_PUBLISH_URL", "  ");
    const fetchMock = vi.fn();

    await publishBoardInvalidate(fetchMock);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not throw when the hub returns an HTTP error", async () => {
    vi.stubEnv("REALTIME_PUBLISH_URL", PUBLISH_URL);
    vi.stubEnv("REALTIME_PUBLISH_SECRET", "publish-secret");
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });

    await expect(publishBoardInvalidate(fetchMock)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      PUBLISH_URL,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ channel: BOARD_REALTIME_CHANNEL }),
        headers: expect.objectContaining({
          Authorization: "Bearer publish-secret",
        }),
      }),
    );
  });

  it("does not throw when the publish request rejects", async () => {
    vi.stubEnv("REALTIME_PUBLISH_URL", PUBLISH_URL);
    const fetchMock = vi.fn().mockRejectedValue(new Error("network"));

    await expect(publishBoardInvalidate(fetchMock)).resolves.toBeUndefined();
  });

  it("schedules publish with after() so hub failure stays off the user action", () => {
    vi.stubEnv("REALTIME_PUBLISH_URL", "");
    vi.mocked(after).mockImplementationOnce(() => {
      throw new Error("outside request");
    });

    expect(() => scheduleBoardInvalidate()).not.toThrow();
  });
});
