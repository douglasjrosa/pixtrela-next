import { describe, it, expect } from "vitest";
import { taskFormSchema } from "./task";

describe("taskFormSchema", () => {
  it("accepts a valid task payload", () => {
    const result = taskFormSchema.safeParse({
      name: "Montagem A",
      qty: 10,
      deliveryDate: "2026-07-18",
      stepDocumentId: "step-1",
      status: "waiting",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing stepDocumentId", () => {
    const result = taskFormSchema.safeParse({
      name: "Montagem A",
      qty: 10,
      deliveryDate: "2026-07-18",
      status: "waiting",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = taskFormSchema.safeParse({
      name: "",
      qty: 1,
      deliveryDate: "2026-07-18",
      stepDocumentId: "step-1",
      status: "waiting",
    });
    expect(result.success).toBe(false);
  });

  it("rejects qty less than 1", () => {
    const result = taskFormSchema.safeParse({
      name: "Montagem A",
      qty: 0,
      deliveryDate: "2026-07-18",
      stepDocumentId: "step-1",
      status: "waiting",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty deliveryDate", () => {
    const result = taskFormSchema.safeParse({
      name: "Montagem A",
      qty: 1,
      deliveryDate: "",
      stepDocumentId: "step-1",
      status: "waiting",
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty templateTaskCode", () => {
    const result = taskFormSchema.safeParse({
      name: "Montagem A",
      qty: 1,
      deliveryDate: "2026-07-18",
      stepDocumentId: "step-1",
      status: "waiting",
      templateTaskCode: "",
    });
    expect(result.success).toBe(true);
  });
});
