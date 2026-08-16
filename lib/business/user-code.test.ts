import { describe, expect, it } from "vitest";

import { isUserCodeAvailable } from "./user-code";

const users = [
  { documentId: "u1", code: 1234 },
  { documentId: "u2", code: 5678 },
];

describe("isUserCodeAvailable", () => {
  it("returns false when another user already has the code", () => {
    expect(isUserCodeAvailable(1234, users)).toBe(false);
  });

  it("returns true when editing the same user with their own code", () => {
    expect(isUserCodeAvailable(1234, users, "u1")).toBe(true);
  });

  it("returns true for a code not used by any user", () => {
    expect(isUserCodeAvailable(9999, users)).toBe(true);
  });

  it("returns true when code is null or omitted", () => {
    expect(isUserCodeAvailable(null, users)).toBe(true);
    expect(isUserCodeAvailable(undefined, users)).toBe(true);
  });

  it("allows multiple users without a code", () => {
    const withNullCode = [
      ...users,
      { documentId: "u3", code: null },
    ];
    expect(isUserCodeAvailable(null, withNullCode)).toBe(true);
  });
});
