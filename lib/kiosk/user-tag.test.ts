import { describe, expect, it } from "vitest";

import { MIN_USER_TAG_LENGTH, normalizeUserTag } from "./user-tag";

describe("normalizeUserTag", () => {
  it("uppercases and strips separators", () => {
    expect(normalizeUserTag("04:a3:b2:c1")).toBe("04A3B2C1");
    expect(normalizeUserTag("04-a3-b2-c1")).toBe("04A3B2C1");
    expect(normalizeUserTag(" 04 a3 b2 c1 ")).toBe("04A3B2C1");
  });

  it("returns null for empty or too-short values", () => {
    expect(normalizeUserTag("")).toBeNull();
    expect(normalizeUserTag("AB")).toBeNull();
    expect(normalizeUserTag(null)).toBeNull();
  });

  it("accepts tags at minimum length", () => {
    const tag = "A".repeat(MIN_USER_TAG_LENGTH);
    expect(normalizeUserTag(tag)).toBe(tag);
  });
});
