import { describe, expect, it } from "vitest";

import { resolveInitialUserPassword } from "./initial-user-password";

describe("resolveInitialUserPassword", () => {
  it("uses explicit password when long enough", () => {
    expect(
      resolveInitialUserPassword({
        password: "secret1",
        code: 1234,
        username: "ana.1234",
      }),
    ).toBe("secret1");
  });

  it("falls back to code when password is missing", () => {
    expect(
      resolveInitialUserPassword({
        code: 9999,
        username: "ana.9999",
      }),
    ).toBe("9999");
  });

  it("falls back to username when password and code are missing", () => {
    expect(
      resolveInitialUserPassword({
        code: null,
        username: "ana.silva",
      }),
    ).toBe("ana.silva");
  });

  it("throws when no password source is available", () => {
    expect(() =>
      resolveInitialUserPassword({
        code: null,
        username: "ab",
      }),
    ).toThrow("initialPasswordUnavailable");
  });
});
