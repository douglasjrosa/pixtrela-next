import { describe, expect, it } from "vitest";

import { currencyFormSchema } from "./currency";

describe("currencyFormSchema", () => {
  it("accepts optional iconMediaId", () => {
    expect(
      currencyFormSchema.parse({
        name: "star",
        title: "Estrela",
        pluralTitle: "Estrelas",
        iconMediaId: 3,
        currencyPerSecond: 1,
      }),
    ).toMatchObject({ iconMediaId: 3, exchangeRate: 0 });
  });

  it("rounds currencyPerSecond to two decimals", () => {
    expect(
      currencyFormSchema.parse({
        name: "star",
        title: "Estrela",
        pluralTitle: "Estrelas",
        currencyPerSecond: 1.234,
      }).currencyPerSecond,
    ).toBe(1.23);
  });

  it("accepts zero, float, and negative exchange rates", () => {
    expect(
      currencyFormSchema.parse({
        name: "star",
        title: "Estrela",
        pluralTitle: "Estrelas",
        currencyPerSecond: 1,
        exchangeRate: 0,
      }).exchangeRate,
    ).toBe(0);
    expect(
      currencyFormSchema.parse({
        name: "star",
        title: "Estrela",
        pluralTitle: "Estrelas",
        currencyPerSecond: 1,
        exchangeRate: -1.25,
      }).exchangeRate,
    ).toBe(-1.25);
  });
});
