import { afterEach, describe, expect, it } from "vitest";

import { issueLoginTicket, verifyLoginTicket } from "./login-ticket";

describe("login-ticket", () => {
  const previousSecret = process.env.AUTH_SECRET;

  afterEach(() => {
    if (previousSecret === undefined) {
      delete process.env.AUTH_SECRET;
    } else {
      process.env.AUTH_SECRET = previousSecret;
    }
  });

  it("issues a ticket that verifies to the same user id", () => {
    process.env.AUTH_SECRET = "test-secret-for-login-ticket";
    const ticket = issueLoginTicket("user-abc", 1_000_000);
    expect(verifyLoginTicket(ticket, 1_000_000)).toBe("user-abc");
  });

  it("rejects expired tickets", () => {
    process.env.AUTH_SECRET = "test-secret-for-login-ticket";
    const ticket = issueLoginTicket("user-abc", 1_000_000);
    expect(verifyLoginTicket(ticket, 1_000_000 + 61_000)).toBeNull();
  });

  it("rejects tampered tickets", () => {
    process.env.AUTH_SECRET = "test-secret-for-login-ticket";
    const ticket = issueLoginTicket("user-abc", 1_000_000);
    const tampered = ticket.replace("user-abc", "user-evil");
    expect(verifyLoginTicket(tampered, 1_000_000)).toBeNull();
  });
});
