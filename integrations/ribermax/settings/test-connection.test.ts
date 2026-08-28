import { afterEach, describe, expect, it, vi } from "vitest";

import { probeRibermaxConnection } from "./test-connection";

describe("probeRibermaxConnection", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns true when the API responds without auth errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status: 200 })),
    );

    const ok = await probeRibermaxConnection({
      baseUrl: "https://rbx.example",
      token: "secret",
    });

    expect(ok).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      "https://rbx.example/produtos?templateData=0",
      expect.objectContaining({
        headers: expect.objectContaining({ Token: "secret" }),
      }),
    );
  });

  it("returns false on unauthorized responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status: 401 })),
    );

    const ok = await probeRibermaxConnection({
      baseUrl: "https://rbx.example/",
      token: "secret",
    });

    expect(ok).toBe(false);
  });
});
