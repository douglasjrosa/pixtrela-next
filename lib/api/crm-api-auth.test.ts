import { beforeEach, describe, expect, it, vi } from "vitest";

const getCrmWebhookSecret = vi.fn();

vi.mock("@/integrations/crm/settings/repo", () => ({
  getCrmWebhookSecret: (...args: unknown[]) => getCrmWebhookSecret(...args),
}));

import { verifyCrmApiToken } from "./crm-api-auth";

describe("verifyCrmApiToken", () => {
  beforeEach(() => {
    getCrmWebhookSecret.mockReset();
  });

  it("returns misconfigured when secret is missing", async () => {
    getCrmWebhookSecret.mockResolvedValue(null);
    const result = await verifyCrmApiToken(new Request("http://localhost"));
    expect(result).toEqual({
      ok: false,
      status: 500,
      error: "misconfigured",
    });
  });

  it("returns unauthorized when Token header is wrong", async () => {
    getCrmWebhookSecret.mockResolvedValue("secret");
    const result = await verifyCrmApiToken(
      new Request("http://localhost", { headers: { Token: "nope" } }),
    );
    expect(result).toEqual({ ok: false, status: 401, error: "unauthorized" });
  });

  it("returns ok when Token matches CRM secret", async () => {
    getCrmWebhookSecret.mockResolvedValue("secret");
    const result = await verifyCrmApiToken(
      new Request("http://localhost", { headers: { Token: "secret" } }),
    );
    expect(result).toEqual({ ok: true });
  });
});
