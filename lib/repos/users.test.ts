import { describe, expect, it } from "vitest";

import {
  hashPassword,
  verifyPassword,
  type UpdateUserPersonalInput,
  type UserRole,
} from "./users";

describe("users password hashing", () => {
  it("hashes and verifies passwords", async () => {
    const hash = await hashPassword("Secret123!");
    expect(hash).not.toBe("Secret123!");
    expect(await verifyPassword("Secret123!", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});

describe("users repo API shapes", () => {
  it("accepts updateUserPersonal input with personal fields", () => {
    const input: UpdateUserPersonalInput = {
      id: "00000000-0000-4000-8000-000000000001",
      name: "Ana",
      lastName: "Silva",
      phone: "11987654321",
    };
    expect(input.name).toBe("Ana");
    expect(input.lastName).toBe("Silva");
  });

  it("lists role union includes kiosk", () => {
    const roles: UserRole[] = [
      "admin",
      "manager",
      "leader",
      "colaborator",
      "kiosk",
    ];
    expect(roles).toHaveLength(5);
  });
});
