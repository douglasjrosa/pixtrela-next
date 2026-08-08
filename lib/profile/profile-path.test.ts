import { describe, expect, it } from "vitest";

import { buildProfilePath, isUserProfilePath } from "./profile-path";

const RESERVED = new Set(["login", "board", "kiosk", "users"]);

describe("buildProfilePath", () => {
  it("builds /{documentId}/profile", () => {
    expect(buildProfilePath("abc123")).toBe("/abc123/profile");
  });
});

describe("isUserProfilePath", () => {
  it("matches own profile paths", () => {
    expect(isUserProfilePath("/abc123/profile", RESERVED)).toBe(true);
  });

  it("rejects reserved segments and other shapes", () => {
    expect(isUserProfilePath("/board/profile", RESERVED)).toBe(false);
    expect(isUserProfilePath("/abc123", RESERVED)).toBe(false);
    expect(isUserProfilePath("/abc123/profile/extra", RESERVED)).toBe(false);
  });
});
