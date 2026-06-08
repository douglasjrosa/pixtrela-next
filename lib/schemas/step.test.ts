import { describe, expect, it } from "vitest";

import { stepFormSchema } from "./step";

describe("stepFormSchema", () => {
  it("accepts valid step", () => {
    expect(stepFormSchema.parse({ name: "Fila", index: 0 })).toEqual({
      name: "Fila",
      index: 0,
    });
  });

  it("rejects empty name", () => {
    expect(stepFormSchema.safeParse({ name: "", index: 0 }).success).toBe(false);
  });
});
