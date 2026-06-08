import { describe, expect, it } from "vitest";

import { teamFormSchema } from "./team";

describe("teamFormSchema", () => {
  it("accepts valid team", () => {
    expect(
      teamFormSchema.parse({
        name: "Linha 1",
        exchangesFirstDay: 5,
        exchangesLastDay: 15,
      }),
    ).toMatchObject({ name: "Linha 1" });
  });
});
