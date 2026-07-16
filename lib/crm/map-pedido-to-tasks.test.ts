import { describe, expect, it } from "vitest";

import {
  buildCrmItemKey,
  buildTaskNameFromPedidoItem,
  mapPedidoToTaskDrafts,
} from "./map-pedido-to-tasks";

describe("mapPedidoToTaskDrafts", () => {
  it("maps each parsed item to a task draft", () => {
    const drafts = mapPedidoToTaskDrafts({
      id: 42,
      itens: [{ Qtd: 10, prodId: 123, nomeProd: "Caixotona" }],
      dataEntrega: "2026-07-15",
      empresaNome: "Max Brasil",
    });

    expect(drafts).toEqual([
      {
        crmPedidoId: 42,
        crmItemKey: "42:0",
        name: "Max Brasil - Caixotona",
        qty: 10,
        deliveryDate: "2026-07-15",
        templateTaskCode: "123",
        prodId: 123,
      },
    ]);
  });

  it("builds stable item keys per pedido index", () => {
    expect(buildCrmItemKey(7, 2)).toBe("7:2");
  });

  it("builds task name from empresa and box name without qty", () => {
    expect(
      buildTaskNameFromPedidoItem(
        { qty: 5, prodId: 1, nomeProd: "Base" },
        "Empresa X",
      ),
    ).toBe("Empresa X - Base");
  });
});
