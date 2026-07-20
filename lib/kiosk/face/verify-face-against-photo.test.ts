import { beforeEach, describe, expect, it, vi } from "vitest";

import { verifyFaceAgainstPhoto } from "./verify-face-against-photo";

vi.mock("./detect-single-descriptor", () => ({
  detectSingleFaceDescriptor: vi.fn(),
}));

import { detectSingleFaceDescriptor } from "./detect-single-descriptor";

const detectMock = vi.mocked(detectSingleFaceDescriptor);

describe("verifyFaceAgainstPhoto", () => {
  beforeEach(() => {
    detectMock.mockReset();
  });

  it("returns success when enough frames match", async () => {
    const reference = new Float32Array([0, 0, 0]);
    detectMock.mockResolvedValue({
      ok: true,
      descriptor: new Float32Array([0.01, 0, 0]),
      box: { width: 100, height: 100 },
    });

    const video = document.createElement("video");
    const result = await verifyFaceAgainstPhoto({
      video,
      referenceDescriptor: reference,
      frameCount: 5,
      minMatchingFrames: 3,
      throttleMs: 0,
      timeoutMs: 5_000,
    });

    expect(result.status).toBe("success");
    expect(result.matchingFrames).toBeGreaterThanOrEqual(3);
  });

  it("returns aborted when signal is aborted", async () => {
    const controller = new AbortController();
    controller.abort();

    const result = await verifyFaceAgainstPhoto({
      video: document.createElement("video"),
      referenceDescriptor: [0, 0],
      signal: controller.signal,
      frameCount: 5,
      throttleMs: 0,
    });

    expect(result.status).toBe("aborted");
  });

  it("returns timeout when the deadline elapses", async () => {
    detectMock.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return {
        ok: false as const,
        reason: "no_face" as const,
      };
    });

    const result = await verifyFaceAgainstPhoto({
      video: document.createElement("video"),
      referenceDescriptor: [0, 0, 0],
      frameCount: 5,
      minMatchingFrames: 3,
      throttleMs: 0,
      timeoutMs: 20,
    });

    expect(result.status).toBe("timeout");
  });
});

describe("stopMediaStream", () => {
  it("stops all tracks and ignores null", async () => {
    const { stopMediaStream } = await import("./verify-face-against-photo");
    const stop = vi.fn();
    stopMediaStream({
      getTracks: () => [{ stop }, { stop }],
    } as unknown as MediaStream);
    expect(stop).toHaveBeenCalledTimes(2);
    expect(() => stopMediaStream(null)).not.toThrow();
  });
});
