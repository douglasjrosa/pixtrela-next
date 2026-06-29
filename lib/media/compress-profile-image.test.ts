import { describe, expect, it } from "vitest";

import { buildProfileImageFileName } from "./compress-profile-image";

describe("buildProfileImageFileName", () => {
  it("converts any extension to jpg", () => {
    expect(buildProfileImageFileName("photo.png")).toBe("photo.jpg");
    expect(buildProfileImageFileName("avatar")).toBe("avatar.jpg");
  });
});
