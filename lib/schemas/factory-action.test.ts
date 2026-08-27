import { describe, expect, it } from "vitest";

import { factoryActionFormSchema } from "./factory-action";

describe("factoryActionFormSchema", () => {
  it("accepts a complete action", () => {
    const parsed = factoryActionFormSchema.parse({
      name: "Grampear quadro",
      description: "One staple",
      unitTime: 1.04,
      qtyQuestion: "How many staples?",
    });
    expect(parsed.unitTime).toBe(1.04);
  });

  it("rejects empty fields and non-positive unit time", () => {
    expect(() =>
      factoryActionFormSchema.parse({
        name: "",
        description: "x",
        unitTime: 1,
        qtyQuestion: "q",
      }),
    ).toThrow();
    expect(() =>
      factoryActionFormSchema.parse({
        name: "A",
        description: "x",
        unitTime: 0,
        qtyQuestion: "q",
      }),
    ).toThrow();
  });
});
