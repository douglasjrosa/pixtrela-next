import { describe, expect, it } from "vitest";

import {
  normalizeBrMobilePhone,
  updateOwnPersonalSchema,
} from "./profile";

describe("normalizeBrMobilePhone", () => {
  it("accepts common Brazilian formats", () => {
    expect(normalizeBrMobilePhone("(11) 98765-4321")).toBe("11987654321");
    expect(normalizeBrMobilePhone("+55 11 98765-4321")).toBe("11987654321");
  });

  it("rejects landlines", () => {
    expect(normalizeBrMobilePhone("1134567890")).toBeNull();
  });
});

describe("updateOwnPersonalSchema", () => {
  it("accepts valid personal data", () => {
    const result = updateOwnPersonalSchema.safeParse({
      name: " Ana ",
      lastName: " Silva ",
      email: "Ana@Example.com",
      phone: "(11) 98765-4321",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        name: "Ana",
        lastName: "Silva",
        email: "ana@example.com",
        phone: "11987654321",
      });
    }
  });

  it("rejects empty name or lastName", () => {
    expect(
      updateOwnPersonalSchema.safeParse({
        name: "",
        lastName: "Silva",
        email: "ana@example.com",
        phone: "11987654321",
      }).success,
    ).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = updateOwnPersonalSchema.safeParse({
      name: "Ana",
      lastName: "Silva",
      email: "bad",
      phone: "11987654321",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid phone", () => {
    const result = updateOwnPersonalSchema.safeParse({
      name: "Ana",
      lastName: "Silva",
      email: "ana@example.com",
      phone: "1134567890",
    });
    expect(result.success).toBe(false);
  });
});
