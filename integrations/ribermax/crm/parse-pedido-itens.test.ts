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
      { qty: 10, prodId: 123, nomeProd: "Caixotona", versions: [] },
      { qty: 2, prodId: 456, nomeProd: "Base", versions: [] },
    ]);
  });

  it("parses versions array and stringified JSON", () => {
    expect(
      parsePedidoItens([
        {
          Qtd: 1,
          prodId: 1277,
          nomeProd: "Caixa",
          versions: ["1234", 1255, "1266", "1266", "bad"],
        },
        {
          Qtd: 1,
          prodId: 99,
          nomeProd: "Base",
          versions: '["10","11"]',
        },
      ]),
    ).toEqual([
      {
        qty: 1,
        prodId: 1277,
        nomeProd: "Caixa",
        versions: ["1234", "1255", "1266"],
      },
      { qty: 1, prodId: 99, nomeProd: "Base", versions: ["10", "11"] },
    ]);
  });

  it("parses stringified JSON items", () => {
    expect(
      parsePedidoItens(
        JSON.stringify([{ Qtd: 1, prodId: 99, nomeProd: "Produto" }]),
      ),
    ).toEqual([{ qty: 1, prodId: 99, nomeProd: "Produto", versions: [] }]);
  });

  it("defaults qty to 1 when Qtd is missing", () => {
    expect(parsePedidoItens([{ prodId: 5, nomeProd: "Item" }])).toEqual([
      { qty: 1, prodId: 5, nomeProd: "Item", versions: [] },
    ]);
  });

  it("skips rows without prodId or a product name", () => {
    expect(
      parsePedidoItens([
        { Qtd: 1, prodId: 0, nomeProd: "Bad" },
        { Qtd: 1, prodId: 2, nomeProd: "" },
        { Qtd: 1, prodId: 3, nomeProd: "Ok" },
      ]),
    ).toEqual([{ qty: 1, prodId: 3, nomeProd: "Ok", versions: [] }]);
  });

  it("falls back to titulo when nomeProd is empty", () => {
    expect(
      parsePedidoItens([
        {
          Qtd: 1,
          prodId: "16238",
          nomeProd: "",
          titulo: "Caixa Estruturada",
        },
      ]),
    ).toEqual([
      {
        qty: 1,
        prodId: 16238,
        nomeProd: "Caixa Estruturada",
        versions: [],
      },
    ]);
  });

  it("returns empty array for null, empty or invalid JSON", () => {
    expect(parsePedidoItens(null)).toEqual([]);
    expect(parsePedidoItens("null")).toEqual([]);
    expect(parsePedidoItens("{bad json")).toEqual([]);
  });
});
