import { describe, expect, it } from "vitest";

import {
  apiTaskUpsertSchema,
  crmPedidoIdFromExternalKey,
} from "./api-task";

describe("apiTaskUpsertSchema", () => {
  it("parses the approved CRM task contract", () => {
    const parsed = apiTaskUpsertSchema.parse({
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
        subtasks: [{ presetName: "Corte", qty: 1, actionUnits: 2 }],
      },
    });
    expect(parsed.externalKey).toBe("123:0");
    expect(parsed.template?.prodId).toBe(16378);
  });
});

describe("crmPedidoIdFromExternalKey", () => {
  it("reads numeric prefix", () => {
    expect(crmPedidoIdFromExternalKey("123:0")).toBe(123);
  });

  it("returns null for non-numeric prefix", () => {
    expect(crmPedidoIdFromExternalKey("abc:0")).toBeNull();
  });
});
