import { describe, expect, it } from "vitest";

import { mapAwardValues } from "./map-award-values";

describe("mapAwardValues", () => {
  it("maps Strapi Value rows with currency relation", () => {
    expect(
      mapAwardValues([
        {
          numberOf: 50,
          currency: { documentId: "c1", name: "star", title: "Estrela" },
        },
      ]),
    ).toEqual([{ numberOf: 50, currencyDocumentId: "c1" }]);
  });

  it("skips rows without currency documentId", () => {
    expect(mapAwardValues([{ numberOf: 10, currency: { name: "star" } }])).toEqual(
      [],
    );
  });
});
