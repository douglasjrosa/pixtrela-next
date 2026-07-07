import { describe, expect, it } from "vitest";

import {
  signWebhookPayload,
  verifyWebhookSignature,
} from "./verify-webhook-signature";

describe("verifyWebhookSignature", () => {
  const secret = "test-secret";
  const body = '{"pedidoId":1}';

  it("accepts a valid HMAC signature", () => {
    const signature = signWebhookPayload(body, secret);
    expect(verifyWebhookSignature(body, signature, secret)).toBe(true);
  });

  it("rejects an invalid signature", () => {
    expect(verifyWebhookSignature(body, "sha256=deadbeef", secret)).toBe(false);
  });

  it("rejects missing prefix", () => {
    const signature = signWebhookPayload(body, secret).replace("sha256=", "");
    expect(verifyWebhookSignature(body, signature, secret)).toBe(false);
  });

  it("rejects null header", () => {
    expect(verifyWebhookSignature(body, null, secret)).toBe(false);
  });
});
