import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
const revalidatePath = vi.fn();
const upsertCrmWebhookSecret = vi.fn();
const getCrmWebhookSecret = vi.fn();
const probeCrmWebhookSecret = vi.fn();

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { role: "admin" }, jwt: "jwt" })),
}));

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

vi.mock("@/integrations/crm/settings/repo", () => ({
  upsertCrmWebhookSecret: (...args: unknown[]) =>
    upsertCrmWebhookSecret(...args),
  getCrmWebhookSecret: (...args: unknown[]) => getCrmWebhookSecret(...args),
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
    upsertCrmWebhookSecret.mockReset();
    getCrmWebhookSecret.mockReset();
    probeCrmWebhookSecret.mockReset();
  });

  it("upserts the webhook secret and revalidates", async () => {
    const { updateCrmConnection } = await import("./actions");
    const formData = new FormData();
    formData.set("webhookSecret", "hmac-secret");
    const result = await updateCrmConnection(formData);
    expect(result).toEqual({ ok: true });
    expect(upsertCrmWebhookSecret).toHaveBeenCalledWith("hmac-secret");
    expect(revalidatePath).toHaveBeenCalledWith("/settings/integrations/crm");
  });

  it("tests saved webhook secret", async () => {
    getCrmWebhookSecret.mockResolvedValue("hmac-secret");
    probeCrmWebhookSecret.mockReturnValue(true);
    const { testCrmConnection } = await import("./actions");
    const result = await testCrmConnection();
    expect(result).toEqual({ ok: true });
    expect(probeCrmWebhookSecret).toHaveBeenCalledWith("hmac-secret");
  });
});
