import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyCrmApiToken = vi.fn();
const upsertTaskFromApi = vi.fn();
const revalidateTag = vi.fn();
const revalidatePath = vi.fn();

vi.mock("@/lib/api/crm-api-auth", () => ({
  verifyCrmApiToken: (...args: unknown[]) => verifyCrmApiToken(...args),
}));

vi.mock("@/lib/business/upsert-task-from-api", () => ({
  upsertTaskFromApi: (...args: unknown[]) => upsertTaskFromApi(...args),
}));

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

describe("POST /api/tasks", () => {
  beforeEach(() => {
    verifyCrmApiToken.mockReset();
    upsertTaskFromApi.mockReset();
    revalidateTag.mockReset();
    revalidatePath.mockReset();
    vi.resetModules();
  });

  it("returns 401 when Token is invalid", async () => {
    verifyCrmApiToken.mockResolvedValue({
      ok: false,
      status: 401,
      error: "unauthorized",
    });
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/tasks", {
        method: "POST",
        body: "{}",
      }),
    );
    expect(response.status).toBe(401);
    expect(upsertTaskFromApi).not.toHaveBeenCalled();
  });

  it("creates a task when body is valid", async () => {
    verifyCrmApiToken.mockResolvedValue({ ok: true });
    upsertTaskFromApi.mockResolvedValue({
      action: "created",
      taskId: "t1",
      templateSource: "payload",
    });
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json", Token: "secret" },
        body: JSON.stringify({
          name: "Cliente - Caixa",
          qty: 10,
          deliveryDate: "2026-07-15",
          externalKey: "123:0",
          templateTaskCode: "16378",
          versions: ["16377"],
          template: {
            prodId: 16378,
            empresaNome: "Cliente",
            boxName: "Caixa",
            subtasks: [],
          },
        }),
      }),
    );
    expect(response.status).toBe(201);
    expect(upsertTaskFromApi).toHaveBeenCalledOnce();
    expect(revalidateTag).toHaveBeenCalledWith("drizzle:tasks", "default");
  });
});
