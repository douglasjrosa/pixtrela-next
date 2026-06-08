import { describe, expect, it } from "vitest";

import { awardFormSchema } from "./award";

describe("awardFormSchema", () => {
  it("accepts award with currency relation values", () => {
    expect(
      awardFormSchema.parse({
        name: "Arroz",
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
        values: [{ numberOf: 30, currencyDocumentId: "c1" }],
      }),
    ).toMatchObject({ warnings: "Validade limitada.", imageId: 3 });
  });
});
