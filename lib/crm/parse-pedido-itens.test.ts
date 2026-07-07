import { describe, expect, it } from "vitest";

import { parsePedidoItens } from "./parse-pedido-itens";

describe("parsePedidoItens", () => {
  it("parses array items with Qtd, prodId and nomeProd", () => {
    expect(
      parsePedidoItens([
        { Qtd: 10, prodId: 123, nomeProd: "Caixotona" },
        { Qtd: "2", prodId: "456", nomeProd: "Base" },
      ]),
    ).toEqual([
      { qty: 10, prodId: 123, nomeProd: "Caixotona" },
      { qty: 2, prodId: 456, nomeProd: "Base" },
    ]);
  });

  it("parses stringified JSON items", () => {
    expect(
      parsePedidoItens(
        JSON.stringify([{ Qtd: 1, prodId: 99, nomeProd: "Produto" }]),
      ),
    ).toEqual([{ qty: 1, prodId: 99, nomeProd: "Produto" }]);
  });

  it("defaults qty to 1 when Qtd is missing", () => {
    expect(parsePedidoItens([{ prodId: 5, nomeProd: "Item" }])).toEqual([
      { qty: 1, prodId: 5, nomeProd: "Item" },
    ]);
  });

  it("skips rows without prodId or nomeProd", () => {
    expect(
      parsePedidoItens([
        { Qtd: 1, prodId: 0, nomeProd: "Bad" },
        { Qtd: 1, prodId: 2, nomeProd: "" },
        { Qtd: 1, prodId: 3, nomeProd: "Ok" },
      ]),
    ).toEqual([{ qty: 1, prodId: 3, nomeProd: "Ok" }]);
  });

  it("returns empty array for null, empty or invalid JSON", () => {
    expect(parsePedidoItens(null)).toEqual([]);
    expect(parsePedidoItens("null")).toEqual([]);
    expect(parsePedidoItens("{bad json")).toEqual([]);
  });
});
