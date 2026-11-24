import { describe, expect, it } from "vitest";

import {
  allocateUniquePanelSlug,
  isPanelSlug,
  slugifyPanelName,
} from "./panel-slug";

describe("slugifyPanelName", () => {
  it("strips accents and joins with hyphens", () => {
    expect(slugifyPanelName("Produção Montagem")).toBe("producao-montagem");
  });

  it("falls back when the name has no letters", () => {
    expect(slugifyPanelName("***")).toBe("tv");
  });
});

describe("allocateUniquePanelSlug", () => {
  it("keeps the base when free", () => {
    expect(allocateUniquePanelSlug("montagem", new Set())).toBe("montagem");
  });

  it("appends a numeric suffix when taken", () => {
    expect(
      allocateUniquePanelSlug("montagem", new Set(["montagem"])),
    ).toBe("montagem-2");
  });
});

describe("isPanelSlug", () => {
  it("accepts hyphenated lowercase tokens", () => {
    expect(isPanelSlug("linha-1")).toBe(true);
    expect(isPanelSlug("Montagem")).toBe(false);
  });
});
