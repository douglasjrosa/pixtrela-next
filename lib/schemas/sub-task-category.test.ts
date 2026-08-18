import { describe, expect, it } from "vitest";

import { subTaskCategoryFormSchema } from "./sub-task-category";

describe("subTaskCategoryFormSchema", () => {
  it("uppercases letter-only refs", () => {
    const data = subTaskCategoryFormSchema.parse({
      name: "Chapas",
      ref: "alm",
    });
    expect(data.ref).toBe("ALM");
  });

  it("rejects refs with digits", () => {
    const result = subTaskCategoryFormSchema.safeParse({
      name: "Chapas",
      ref: "C3",
    });
    expect(result.success).toBe(false);
  });
});
