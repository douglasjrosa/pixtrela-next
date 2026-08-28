import { describe, expect, it } from "vitest";

import { probeCrmWebhookSecret } from "./test-connection";

describe("probeCrmWebhookSecret", () => {
  it("validates HMAC round-trip for the saved secret", () => {
    expect(probeCrmWebhookSecret("hmac-secret")).toBe(true);
  });
});
