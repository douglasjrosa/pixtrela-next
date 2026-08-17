import { describe, expect, it } from "vitest";

import { isUserEmailAvailable } from "./user-email";

describe("isUserEmailAvailable", () => {
  const users = [
    { documentId: "u1", email: "ana@example.com" },
    { documentId: "u2", email: "bob@example.com" },
  ];

  it("rejects duplicate emails", () => {
    expect(isUserEmailAvailable("ana@example.com", users)).toBe(false);
  });

  it("allows the same email when editing that user", () => {
    expect(isUserEmailAvailable("ana@example.com", users, "u1")).toBe(true);
  });

  it("rejects synthetic local emails", () => {
    expect(isUserEmailAvailable("ana@internal.local", users)).toBe(false);
  });
});
