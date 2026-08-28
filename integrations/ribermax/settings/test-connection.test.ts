import { afterEach, describe, expect, it, vi } from "vitest";

import { probeRibermaxConnection } from "./test-connection";

describe("probeRibermaxConnection", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns true when the handshake accepts the token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response('{"ok":true}', { status: 200 })),
    );

    const ok = await probeRibermaxConnection({
      baseUrl: "https://rbx.example",
      token: "secret",
    });

    expect(ok).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      "https://rbx.example/handshake",
      expect.objectContaining({
        headers: expect.objectContaining({ Token: "secret" }),
      }),
    );
  });

  it("returns false on unauthorized responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response('{"ok":false}', { status: 401 })),
    );

    const ok = await probeRibermaxConnection({
      baseUrl: "https://rbx.example/",
      token: "secret",
    });

    expect(ok).toBe(false);
  });

  it("returns false when the request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network");
      }),
    );

    const ok = await probeRibermaxConnection({
      baseUrl: "https://rbx.example",
      token: "secret",
    });

    expect(ok).toBe(false);
  });
});
