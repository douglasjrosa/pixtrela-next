import { describe, expect, it } from "vitest";

import { deriveUserEmail } from "@/lib/users/create-user-payload";

import { isUserLoginAvailable, type UserLoginOwner } from "./user-login";

const users: UserLoginOwner[] = [
  {
    documentId: "u1",
    username: "maria.1",
    email: "maria.1@pixtrela.local",
  },
  {
    documentId: "u2",
    username: "joao.silva.2",
    // Orphan email left after a username rename without sync.
    email: "joao.2@pixtrela.local",
  },
];

describe("isUserLoginAvailable", () => {
  it("rejects when username already exists (case-insensitive)", () => {
    expect(isUserLoginAvailable("Maria.1", users)).toBe(false);
  });

  it("rejects when derived email collides with an orphan email", () => {
    expect(isUserLoginAvailable("joao.2", users)).toBe(false);
    expect(deriveUserEmail("joao.2")).toBe("joao.2@pixtrela.local");
  });

  it("allows a free login", () => {
    expect(isUserLoginAvailable("ana.9", users)).toBe(true);
  });

  it("allows keeping the same login when editing", () => {
    expect(isUserLoginAvailable("maria.1", users, "u1")).toBe(true);
  });
});
