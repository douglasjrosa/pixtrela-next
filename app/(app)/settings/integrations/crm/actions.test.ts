import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
const revalidatePath = vi.fn();
const upsertCrmConnection = vi.fn();
const getCrmConnection = vi.fn();
const probeCrmWebhookSecret = vi.fn();

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { role: "admin" }, jwt: "jwt" })),
}));

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

vi.mock("@/integrations/crm/settings/repo", () => ({
  upsertCrmConnection: (...args: unknown[]) => upsertCrmConnection(...args),
  getCrmConnection: (...args: unknown[]) => getCrmConnection(...args),
}));

vi.mock("@/integrations/crm/settings/test-connection", () => ({
  probeCrmWebhookSecret: (...args: unknown[]) =>
    probeCrmWebhookSecret(...args),
}));

describe("crm settings actions", () => {
  beforeEach(() => {
    vi.resetModules();
    revalidateTag.mockReset();
    revalidatePath.mockReset();
    upsertCrmConnection.mockReset();
    getCrmConnection.mockReset();
    probeCrmWebhookSecret.mockReset();
  });

  it("upserts CRM connection and revalidates", async () => {
    const { updateCrmConnection } = await import("./actions");
    const formData = new FormData();
    formData.set("baseUrl", "https://crm.example");
    formData.set("webhookSecret", "hmac-secret");
    const result = await updateCrmConnection(formData);
    expect(result).toEqual({ ok: true });
    expect(upsertCrmConnection).toHaveBeenCalledWith({
      baseUrl: "https://crm.example",
      webhookSecret: "hmac-secret",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/settings/integrations/crm");
  });

  it("tests saved CRM handshake credentials", async () => {
    getCrmConnection.mockResolvedValue({
      baseUrl: "https://crm.example",
      webhookSecret: "hmac-secret",
    });
    probeCrmWebhookSecret.mockResolvedValue(true);
    const { testCrmConnection } = await import("./actions");
    const result = await testCrmConnection();
    expect(result).toEqual({ ok: true });
    expect(probeCrmWebhookSecret).toHaveBeenCalledWith({
      baseUrl: "https://crm.example",
      webhookSecret: "hmac-secret",
    });
  });
});
