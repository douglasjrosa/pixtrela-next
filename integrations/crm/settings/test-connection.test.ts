import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { probeCrmWebhookSecret } from "./test-connection";

const fetchMock = vi.fn();

describe("probeCrmWebhookSecret", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns true when the CRM handshake accepts the secret", async () => {
    fetchMock.mockResolvedValue({ ok: true });

    const ok = await probeCrmWebhookSecret({
      baseUrl: "https://crm.example",
      webhookSecret: "hmac-secret",
    });

    expect(ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://crm.example/api/pixtrela/handshake");
    expect(init.method).toBe("GET");
    expect(init.headers).toMatchObject({
      Token: "hmac-secret",
      Accept: "application/json",
    });
  });

  it("returns false when the handshake rejects the secret", async () => {
    fetchMock.mockResolvedValue({ ok: false });

    const ok = await probeCrmWebhookSecret({
      baseUrl: "https://crm.example",
      webhookSecret: "hmac-secret",
    });

    expect(ok).toBe(false);
  });

  it("returns false when the handshake request fails", async () => {
    fetchMock.mockRejectedValue(new Error("network"));

    const ok = await probeCrmWebhookSecret({
      baseUrl: "https://crm.example",
      webhookSecret: "hmac-secret",
    });

    expect(ok).toBe(false);
  });
});
