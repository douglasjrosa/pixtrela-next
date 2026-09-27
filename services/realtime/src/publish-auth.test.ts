import { describe, expect, it } from "vitest";
import { isAuthorizedPublisher } from "./publish-auth.js";

const SECRET = "abcdef0123456789abcdef0123456789";

describe("isAuthorizedPublisher", () => {
  it("accepts a matching bearer secret", () => {
    expect(isAuthorizedPublisher(`Bearer ${SECRET}`, SECRET)).toBe(true);
  });

  it("accepts the bearer scheme in any case", () => {
    expect(isAuthorizedPublisher(`bearer ${SECRET}`, SECRET)).toBe(true);
  });

  it("rejects a missing header, a mismatch, and an empty secret", () => {
    expect(isAuthorizedPublisher(undefined, SECRET)).toBe(false);
    expect(isAuthorizedPublisher("Bearer wrong-secret-value-32-chars-xx", SECRET)).toBe(
      false,
    );
    expect(isAuthorizedPublisher(`Bearer ${SECRET}`, "")).toBe(false);
    expect(isAuthorizedPublisher("Basic abc", SECRET)).toBe(false);
  });
});
