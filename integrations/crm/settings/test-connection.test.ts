import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CRM_WEBHOOK_SIGNATURE_HEADER } from "@/integrations/ribermax/crm/crm-webhook-http";

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

  it("returns true when the webhook route accepts the signed probe", async () => {
    fetchMock.mockResolvedValue({ ok: true });

    const ok = await probeCrmWebhookSecret("hmac-secret");

    expect(ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/webhooks/crm-pedido");
    expect(init.method).toBe("POST");
    expect(init.body).toContain('"Bpedido":""');
    expect(init.headers).toMatchObject({
      "Content-Type": "application/json",
      [CRM_WEBHOOK_SIGNATURE_HEADER]: expect.stringMatching(/^sha256=/),
    });
  });

  it("returns false when the webhook route rejects the probe", async () => {
    fetchMock.mockResolvedValue({ ok: false });

    const ok = await probeCrmWebhookSecret("hmac-secret");

    expect(ok).toBe(false);
  });

  it("returns false when the webhook request fails", async () => {
    fetchMock.mockRejectedValue(new Error("network"));

    const ok = await probeCrmWebhookSecret("hmac-secret");

    expect(ok).toBe(false);
  });
});
