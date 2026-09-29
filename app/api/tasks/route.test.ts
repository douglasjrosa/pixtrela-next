import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyCrmApiToken = vi.fn();
const upsertTaskFromApi = vi.fn();
const deleteTasksFromApiByCrmPedidoId = vi.fn();
const revalidateTag = vi.fn();
const revalidatePath = vi.fn();
const auditBug = vi.fn();
const scheduleCrmTasksLog = vi.fn();

vi.mock("@/lib/api/crm-api-auth", () => ({
  verifyCrmApiToken: (...args: unknown[]) => verifyCrmApiToken(...args),
}));

vi.mock("@/lib/business/upsert-task-from-api", () => ({
  upsertTaskFromApi: (...args: unknown[]) => upsertTaskFromApi(...args),
}));

vi.mock("@/lib/business/delete-tasks-from-api", () => ({
  deleteTasksFromApiByCrmPedidoId: (...args: unknown[]) =>
    deleteTasksFromApiByCrmPedidoId(...args),
}));

vi.mock("@/lib/logs/record-log", () => ({
  auditBug: (...args: unknown[]) => auditBug(...args),
  scheduleCrmTasksLog: (...args: unknown[]) => scheduleCrmTasksLog(...args),
}));

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

vi.mock("next/server", () => ({
  after: (fn: () => void) => {
    fn();
  },
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => Response.json(body, init),
  },
}));

describe("POST /api/tasks", () => {
  beforeEach(() => {
    verifyCrmApiToken.mockReset();
    upsertTaskFromApi.mockReset();
    deleteTasksFromApiByCrmPedidoId.mockReset();
    revalidateTag.mockReset();
    revalidatePath.mockReset();
    auditBug.mockReset();
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

  it("awaits an immediate bug log before the 500 response", async () => {
    verifyCrmApiToken.mockResolvedValue({ ok: true });
    const failure = new Error("duplicate key value violates unique constraint");
    upsertTaskFromApi.mockRejectedValue(failure);
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    auditBug.mockReturnValue(gate);
    const { POST } = await import("./route");
    const pending = POST(
      new Request("http://localhost/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json", Token: "secret" },
        body: JSON.stringify({
          name: "Cliente - Caixa",
          qty: 10,
          deliveryDate: "2026-07-15",
          externalKey: "123:0",
          templateTaskCode: "17426",
        }),
      }),
    );
    let settled = false;
    void pending.then(() => {
      settled = true;
    });
    await vi.waitFor(() => {
      expect(auditBug).toHaveBeenCalled();
    });
    expect(settled).toBe(false);
    expect(auditBug).toHaveBeenCalledWith({
      route: "/api/tasks",
      operation: "crm.upsert",
      error: failure,
      immediate: true,
      ids: {
        externalKey: "123:0",
        templateTaskCode: "17426",
      },
    });
    release();
    const response = await pending;
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "internal_error" });
  });
});

describe("DELETE /api/tasks", () => {
  beforeEach(() => {
    verifyCrmApiToken.mockReset();
    deleteTasksFromApiByCrmPedidoId.mockReset();
    revalidateTag.mockReset();
    revalidatePath.mockReset();
    vi.resetModules();
  });

  it("deletes tasks by crmPedidoId", async () => {
    verifyCrmApiToken.mockResolvedValue({ ok: true });
    deleteTasksFromApiByCrmPedidoId.mockResolvedValue({ deletedCount: 1 });
    const { DELETE } = await import("./route");
    const response = await DELETE(
      new Request("http://localhost/api/tasks?crmPedidoId=123", {
        method: "DELETE",
        headers: { Token: "secret" },
      }),
    );
    expect(response.status).toBe(200);
    expect(deleteTasksFromApiByCrmPedidoId).toHaveBeenCalledWith(123);
  });
});
