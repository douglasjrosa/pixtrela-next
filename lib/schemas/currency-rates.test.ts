import { describe, expect, it } from "vitest";

import { currencyRatesFormSchema } from "./currency-rates";

describe("currencyRatesFormSchema", () => {
  it("accepts rates for multiple currencies", () => {
    expect(
      currencyRatesFormSchema.parse({
        rates: [
          { documentId: "cur-star", currencyPerSecond: 1 },
          { documentId: "cur-gem", currencyPerSecond: 0.5 },
        ],
      }),
    ).toEqual({
      rates: [
        { documentId: "cur-star", currencyPerSecond: 1 },
        { documentId: "cur-gem", currencyPerSecond: 0.5 },
      ],
    });
  });

  it("rejects negative rates", () => {
    expect(() =>
      currencyRatesFormSchema.parse({
        rates: [{ documentId: "cur-star", currencyPerSecond: -1 }],
      }),
    ).toThrow();
  });
});
