import { describe, expect, it } from "vitest";

import { isUserEmailAvailable } from "./user-email";

describe("isUserEmailAvailable", () => {
  const users = [
    {
      documentId: "u1",
      username: "ana.1",
      email: "ana@example.com",
    },
    {
      documentId: "u2",
      username: "joao.2",
      email: "joao.2@pixtrela.local",
    },
    {
      documentId: "u3",
      username: "maria.3",
      email: null,
    },
  ];

  it("rejects duplicate emails", () => {
    expect(isUserEmailAvailable("ana@example.com", users)).toBe(false);
  });

  it("allows the same email when editing that user", () => {
    expect(isUserEmailAvailable("ana@example.com", users, "u1")).toBe(true);
  });

  it("allows pixtrela.local emails when they are unique", () => {
    expect(isUserEmailAvailable("ana.123@pixtrela.local", users)).toBe(true);
  });

  it("allows keeping a pixtrela.local email when editing that user", () => {
    expect(
      isUserEmailAvailable("joao.2@pixtrela.local", users, "u2"),
    ).toBe(true);
  });

  it("rejects emails that collide with another user's derived email", () => {
    expect(isUserEmailAvailable("maria.3@pixtrela.local", users)).toBe(false);
  });

  it("allows changing email to a new unique address when editing", () => {
    expect(
      isUserEmailAvailable("ana.123@pixtrela.locals", users, "u1"),
    ).toBe(true);
  });
});
