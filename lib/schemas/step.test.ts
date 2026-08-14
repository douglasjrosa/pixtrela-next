import { describe, expect, it } from "vitest";

import { stepFormSchema, stepNameFormSchema } from "./step";

describe("stepNameFormSchema", () => {
  it("accepts a valid name", () => {
    expect(stepNameFormSchema.parse({ name: "Fila" })).toEqual({
      name: "Fila",
      orderBy: "manual",
    });
  });

  it("accepts orderBy options", () => {
    expect(
      stepNameFormSchema.parse({
        name: "Fila",
        orderBy: "delivery_date_asc",
      }),
    ).toEqual({
      name: "Fila",
      orderBy: "delivery_date_asc",
    });
  });

  it("rejects empty name", () => {
    expect(stepNameFormSchema.safeParse({ name: "" }).success).toBe(false);
  });
});

describe("stepFormSchema", () => {
  it("accepts valid step with index", () => {
    expect(stepFormSchema.parse({ name: "Fila", index: 0 })).toEqual({
      name: "Fila",
      index: 0,
      orderBy: "manual",
    });
  });

  it("rejects empty name", () => {
    expect(stepFormSchema.safeParse({ name: "", index: 0 }).success).toBe(false);
  });
});
