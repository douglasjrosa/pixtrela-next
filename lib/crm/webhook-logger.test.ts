import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  crmWebhookLog,
  summarizeSignatureHeader,
} from "./webhook-logger";

describe("summarizeSignatureHeader", () => {
  it("reports missing signature", () => {
    expect(summarizeSignatureHeader(null)).toBe("missing");
  });

  it("reports present signature without leaking full value", () => {
    const summary = summarizeSignatureHeader("sha256=abcdef1234567890");
    expect(summary).toContain("present(");
    expect(summary).not.toContain("1234567890");
  });
});

describe("crmWebhookLog", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("writes structured info logs", () => {
    crmWebhookLog.info("test_event", { requestId: "abc", count: 1 });
    expect(console.log).toHaveBeenCalledWith(
      '[crm-webhook] event=test_event requestId="abc" count=1',
    );
  });
});
