import { describe, expect, it } from "vitest";

import { isAuthenticatedSession, LOGIN_PATH, SESSION_EXPIRED_QUERY } from "./session";

describe("isAuthenticatedSession", () => {
  it("accepts drizzle session with role and empty jwt", () => {
    expect(
      isAuthenticatedSession({
        user: { id: "1", name: "Admin", role: "admin" },
        jwt: "",
        expires: "",
      }),
    ).toBe(true);
  });

  it("accepts legacy session with Strapi jwt and role", () => {
    expect(
      isAuthenticatedSession({
        user: { id: "1", name: "Admin", role: "admin" },
        jwt: "token",
        expires: "",
      }),
    ).toBe(true);
  });

  it("rejects session without role", () => {
    expect(
      isAuthenticatedSession({
        user: { id: "1", name: "Admin" },
        jwt: "token",
        expires: "",
      }),
    ).toBe(false);
  });

  it("rejects empty session", () => {
    expect(isAuthenticatedSession(null)).toBe(false);
  });
});

describe("LOGIN_PATH", () => {
  it("includes session expired reason", () => {
    expect(LOGIN_PATH).toContain(SESSION_EXPIRED_QUERY);
  });
});
