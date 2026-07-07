import { describe, it, expect } from "vitest";
import { taskFormSchema } from "./task";

describe("taskFormSchema", () => {
  it("accepts a valid task payload", () => {
    const result = taskFormSchema.safeParse({
      name: "Montagem A",
      qty: 10,
      stepDocumentId: "step-1",
      status: "waiting",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing stepDocumentId", () => {
    const result = taskFormSchema.safeParse({
      name: "Montagem A",
      qty: 10,
      status: "waiting",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = taskFormSchema.safeParse({ name: "", qty: 1, status: "waiting" });
    expect(result.success).toBe(false);
  });
});
