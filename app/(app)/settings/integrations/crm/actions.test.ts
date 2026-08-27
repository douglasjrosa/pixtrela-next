import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
const revalidatePath = vi.fn();
const redirect = vi.fn();
const upsertCrmWebhookSecret = vi.fn();

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { role: "admin" }, jwt: "jwt" })),
}));

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
}));

vi.mock("@/integrations/crm/settings/repo", () => ({
  upsertCrmWebhookSecret: (...args: unknown[]) =>
    upsertCrmWebhookSecret(...args),
}));

describe("crm settings actions", () => {
  beforeEach(() => {
    vi.resetModules();
    revalidateTag.mockReset();
    revalidatePath.mockReset();
    redirect.mockReset();
    upsertCrmWebhookSecret.mockReset();
  });

  it("upserts the webhook secret and revalidates", async () => {
    const { updateCrmConnection } = await import("./actions");
    const formData = new FormData();
    formData.set("webhookSecret", "hmac-secret");
    await updateCrmConnection(formData);
    expect(upsertCrmWebhookSecret).toHaveBeenCalledWith("hmac-secret");
    expect(revalidatePath).toHaveBeenCalledWith("/settings/integrations/crm");
    expect(redirect).toHaveBeenCalledWith("/settings/integrations/crm");
  });
});
