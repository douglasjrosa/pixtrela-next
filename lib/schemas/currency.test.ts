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
    ).toMatchObject({ iconMediaId: 3 });
  });
});
