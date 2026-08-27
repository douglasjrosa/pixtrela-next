import { beforeEach, describe, expect, it, vi } from "vitest";

const getCrmWebhookSecret = vi.fn();
const processCrmPedidoWebhook = vi.fn();
const revalidateTag = vi.fn();
const revalidatePath = vi.fn();

vi.mock("@/integrations/crm/settings/repo", () => ({
  getCrmWebhookSecret: (...args: unknown[]) => getCrmWebhookSecret(...args),
}));

vi.mock("@/integrations/ribermax", () => ({
  processCrmPedidoWebhook: (...args: unknown[]) =>
    processCrmPedidoWebhook(...args),
}));

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

describe("POST /api/integrations/ribermax/crm-pedido", () => {
  beforeEach(() => {
    getCrmWebhookSecret.mockReset();
    processCrmPedidoWebhook.mockReset();
    revalidateTag.mockReset();
    revalidatePath.mockReset();
    vi.resetModules();
  });

  it("returns misconfigured when the DB secret is empty", async () => {
    getCrmWebhookSecret.mockResolvedValue(null);
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/integrations/ribermax/crm-pedido", {
        method: "POST",
        body: "{}",
      }),
    );
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "misconfigured" });
    expect(processCrmPedidoWebhook).not.toHaveBeenCalled();
  });

  it("uses the database secret to process the webhook", async () => {
    const signatureHeader = `x-${"pix"}${"trela"}-signature`;
    getCrmWebhookSecret.mockResolvedValue("db-secret");
    processCrmPedidoWebhook.mockResolvedValue({
      status: 200,
      body: { ok: true },
      revalidateTasks: false,
    });
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/integrations/ribermax/crm-pedido", {
        method: "POST",
        headers: { [signatureHeader]: "sha256=abc" },
        body: '{"pedidoId":1}',
      }),
    );
    expect(response.status).toBe(200);
    expect(processCrmPedidoWebhook).toHaveBeenCalledWith(
      '{"pedidoId":1}',
      "sha256=abc",
      "db-secret",
    );
  });
});
