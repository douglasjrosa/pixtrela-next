import { describe, expect, it } from "vitest";

import { currencyFormSchema } from "./currency";

describe("currencyFormSchema", () => {
  it("accepts star currency", () => {
    expect(
      currencyFormSchema.parse({
        name: "star",
        title: "Estrela",
        pluralTitle: "Estrelas",
        currencyPerSecond: 1,
      }),
    ).toMatchObject({ name: "star" });
  });
});
