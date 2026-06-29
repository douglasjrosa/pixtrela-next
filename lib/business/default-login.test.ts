import { describe, expect, it } from "vitest";

import { buildDefaultLogin } from "./default-login";

describe("buildDefaultLogin", () => {
  it("joins lowercase name parts and code with dots", () => {
    expect(buildDefaultLogin("Ana Maria", 4321)).toBe("ana.maria.4321");
  });

  it("handles a single-word name", () => {
    expect(buildDefaultLogin("Régia", 1111)).toBe("régia.1111");
  });

  it("accepts string codes", () => {
    expect(buildDefaultLogin("Ana", "4321")).toBe("ana.4321");
  });

  it("collapses whitespace and trims the name", () => {
    expect(buildDefaultLogin("  Ana   Maria  ", 4321)).toBe("ana.maria.4321");
  });

  it("returns only the code when name is empty", () => {
    expect(buildDefaultLogin("", 4321)).toBe("4321");
  });

  it("returns only the name when code is empty", () => {
    expect(buildDefaultLogin("Ana Maria", "")).toBe("ana.maria");
  });

  it("returns empty string when both name and code are empty", () => {
    expect(buildDefaultLogin("", "")).toBe("");
    expect(buildDefaultLogin("   ", 0)).toBe("0");
  });

  it("includes zero as a valid code suffix", () => {
    expect(buildDefaultLogin("Ana", 0)).toBe("ana.0");
  });
});
