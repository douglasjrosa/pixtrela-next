import { beforeEach, describe, expect, it, vi } from "vitest";

const getRibermaxConnection = vi.fn();

vi.mock("@/integrations/ribermax/settings/connection-repo", () => ({
  getRibermaxConnection: (...args: unknown[]) => getRibermaxConnection(...args),
}));

describe("verifyRbxApiToken", () => {
  beforeEach(() => {
    getRibermaxConnection.mockReset();
    vi.resetModules();
  });

  it("returns misconfigured when connection is missing", async () => {
    getRibermaxConnection.mockResolvedValue(null);
    const { verifyRbxApiToken } = await import("./rbx-api-auth");
    const request = new Request("https://app.example/api", {
      headers: { Token: "secret" },
    });
    await expect(verifyRbxApiToken(request)).resolves.toEqual({
      ok: false,
      status: 500,
      error: "misconfigured",
    });
  });

  it("returns unauthorized when token does not match", async () => {
    getRibermaxConnection.mockResolvedValue({
      baseUrl: "https://rbx.example",
      token: "expected",
    });
    const { verifyRbxApiToken } = await import("./rbx-api-auth");
    const request = new Request("https://app.example/api", {
      headers: { Token: "wrong" },
    });
    await expect(verifyRbxApiToken(request)).resolves.toEqual({
      ok: false,
      status: 401,
      error: "unauthorized",
    });
  });

  it("accepts matching token header", async () => {
    getRibermaxConnection.mockResolvedValue({
      baseUrl: "https://rbx.example",
      token: "expected",
    });
    const { verifyRbxApiToken } = await import("./rbx-api-auth");
    const request = new Request("https://app.example/api", {
      headers: { Token: "expected" },
    });
    await expect(verifyRbxApiToken(request)).resolves.toEqual({ ok: true });
  });
});
