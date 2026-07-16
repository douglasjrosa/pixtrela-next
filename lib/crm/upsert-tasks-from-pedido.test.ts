import { beforeEach, describe, expect, it, vi } from "vitest";

const strapiServiceFetch = vi.fn();
const ensureTemplateTaskForProdId = vi.fn();

vi.mock("@/lib/strapi/service-fetch", () => ({
  strapiServiceFetch: (...args: unknown[]) => strapiServiceFetch(...args),
}));

vi.mock("@/lib/business/ensure-template-for-prod-id", () => ({
  ensureTemplateTaskForProdId: (...args: unknown[]) =>
    ensureTemplateTaskForProdId(...args),
}));

import {
  isEligiblePedidoPayload,
  upsertTasksFromPedido,
  type CrmPedidoWebhookPayload,
} from "./upsert-tasks-from-pedido";

const BASE_PAYLOAD: CrmPedidoWebhookPayload = {
  pedidoId: 42,
  Bpedido: "B-100",
  itens: [{ Qtd: 10, prodId: 123, nomeProd: "Caixotona" }],
  dataEntrega: "2026-07-15",
  empresaNome: "Max Brasil",
};

function mockStrapiForCreate(): void {
  strapiServiceFetch.mockImplementation(async (path: string, init?: { method?: string }) => {
    if (path === "/steps") {
      return { data: [{ documentId: "step-1", name: "Fila de produção" }] };
    }
    if (path === "/tasks" && !init?.method) {
      return { data: [{ index: 0 }] };
    }
    if (path === "/tasks" && init?.method === "POST") {
      return { data: { documentId: "task-new" } };
    }
    if (path.startsWith("/tasks") && init?.method === "PUT") {
      return { data: { documentId: "task-1" } };
    }
    return { data: [] };
  });
}

describe("isEligiblePedidoPayload", () => {
  it("returns false when Bpedido is empty", () => {
    expect(isEligiblePedidoPayload({ ...BASE_PAYLOAD, Bpedido: "" })).toBe(false);
    expect(isEligiblePedidoPayload({ ...BASE_PAYLOAD, Bpedido: "   " })).toBe(false);
  });

  it("returns true when Bpedido is set", () => {
    expect(isEligiblePedidoPayload(BASE_PAYLOAD)).toBe(true);
  });
});

describe("upsertTasksFromPedido", () => {
  beforeEach(() => {
    strapiServiceFetch.mockReset();
    ensureTemplateTaskForProdId.mockReset();
    ensureTemplateTaskForProdId.mockResolvedValue(undefined);
  });

  it("skips when Bpedido is empty", async () => {
    const result = await upsertTasksFromPedido({ ...BASE_PAYLOAD, Bpedido: "" });
    expect(result).toEqual({ created: 0, updated: 0, skipped: 0 });
    expect(strapiServiceFetch).not.toHaveBeenCalled();
  });

  it("creates a new task when crmItemKey does not exist", async () => {
    mockStrapiForCreate();
    strapiServiceFetch.mockImplementation(async (path: string, init?: { method?: string }) => {
      if (path === "/steps") {
        return { data: [{ documentId: "step-1", name: "Fila de produção" }] };
      }
      if (path === "/tasks" && !init?.method) {
        const body = init as { query?: { filters?: { crmItemKey?: unknown } } } | undefined;
        if (body?.query?.filters?.crmItemKey) {
          return { data: [] };
        }
        return { data: [{ index: 0 }] };
      }
      if (path === "/tasks" && init?.method === "POST") {
        return { data: { documentId: "task-new" } };
      }
      return { data: [] };
    });

    const result = await upsertTasksFromPedido(BASE_PAYLOAD);

    expect(result.created).toBe(1);
    expect(result.updated).toBe(0);
    expect(ensureTemplateTaskForProdId).toHaveBeenCalledWith(
      123,
      "Max Brasil - Caixotona",
    );
    const postCall = strapiServiceFetch.mock.calls.find(
      ([, init]) => (init as { method?: string })?.method === "POST",
    );
    expect(postCall).toBeDefined();
    const body = JSON.parse((postCall![1] as { body: string }).body);
    expect(body.data.crmItemKey).toBe("42:0");
    expect(body.data.crmPedidoId).toBe(42);
  });

  it("updates an existing task when crmItemKey matches", async () => {
    strapiServiceFetch.mockImplementation(async (path: string, init?: { method?: string }) => {
      if (path === "/steps") {
        return { data: [{ documentId: "step-1", name: "Fila de produção" }] };
      }
      if (path === "/tasks" && !init?.method) {
        return {
          data: [
            {
              documentId: "task-1",
              name: "Old name",
              qty: 5,
              deliveryDate: "2026-01-01",
              crmItemKey: "42:0",
            },
          ],
        };
      }
      if (path === "/tasks/task-1" && init?.method === "PUT") {
        return { data: { documentId: "task-1" } };
      }
      return { data: [{ index: 0 }] };
    });

    const result = await upsertTasksFromPedido(BASE_PAYLOAD);

    expect(result.created).toBe(0);
    expect(result.updated).toBe(1);
    expect(ensureTemplateTaskForProdId).not.toHaveBeenCalled();
    const putCall = strapiServiceFetch.mock.calls.find(
      ([path, init]) => path === "/tasks/task-1" && (init as { method?: string })?.method === "PUT",
    );
    const body = JSON.parse((putCall![1] as { body: string }).body);
    expect(body.data.name).toBe("Max Brasil - Caixotona");
    expect(body.data.qty).toBe(10);
    expect(body.data.templateTaskCode).toBeUndefined();
  });

  it("is idempotent when payload is unchanged", async () => {
    strapiServiceFetch.mockImplementation(async (path: string, init?: { method?: string }) => {
      if (path === "/steps") {
        return { data: [{ documentId: "step-1", name: "Fila de produção" }] };
      }
      if (path === "/tasks" && !init?.method) {
        return {
          data: [
            {
              documentId: "task-1",
              name: "Max Brasil - Caixotona",
              qty: 10,
              deliveryDate: "2026-07-15",
              crmItemKey: "42:0",
            },
          ],
        };
      }
      return { data: [{ index: 0 }] };
    });

    const first = await upsertTasksFromPedido(BASE_PAYLOAD);
    const second = await upsertTasksFromPedido(BASE_PAYLOAD);

    expect(first).toEqual({ created: 0, updated: 0, skipped: 1 });
    expect(second).toEqual({ created: 0, updated: 0, skipped: 1 });
    expect(
      strapiServiceFetch.mock.calls.filter(
        ([, init]) => (init as { method?: string })?.method === "PUT",
      ),
    ).toHaveLength(0);
  });
});
