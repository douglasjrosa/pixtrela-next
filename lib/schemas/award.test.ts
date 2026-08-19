import { describe, expect, it } from "vitest";

import { awardFormSchema } from "./award";

describe("awardFormSchema", () => {
  it("accepts award with currency relation values", () => {
    expect(
      awardFormSchema.parse({
        name: "Arroz",
        showInStore: true,
        stock: 0,
        values: [{ numberOf: 50, currencyDocumentId: "c1" }],
      }),
    ).toMatchObject({ name: "Arroz" });
  });

  it("accepts optional warnings and imageId", () => {
    expect(
      awardFormSchema.parse({
        name: "Feijão",
        warnings: "Validade limitada.",
        imageId: 3,
        showInStore: false,
        stock: 12,
        values: [{ numberOf: 30, currencyDocumentId: "c1" }],
      }),
    ).toMatchObject({ warnings: "Validade limitada.", imageId: 3 });
  });

  it("accepts zero currency value to disable a price", () => {
    expect(
      awardFormSchema.parse({
        name: "Arroz",
        showInStore: true,
        stock: 0,
        values: [
          { numberOf: 0, currencyDocumentId: "c1" },
          { numberOf: 50, currencyDocumentId: "c2" },
        ],
      }),
    ).toMatchObject({
      values: [
        { numberOf: 0, currencyDocumentId: "c1" },
        { numberOf: 50, currencyDocumentId: "c2" },
      ],
    });
  });

  it("accepts uuid imageId for drizzle media", () => {
    expect(
      awardFormSchema.parse({
        name: "Açúcar",
        imageId: "550e8400-e29b-41d4-a716-446655440000",
        showInStore: true,
        stock: 0,
        values: [{ numberOf: 10, currencyDocumentId: "c1" }],
      }).imageId,
    ).toBe("550e8400-e29b-41d4-a716-446655440000");
  });
});
