import { describe, expect, it } from "vitest";

import { resolveSubTaskCategoryDisplayName } from "./resolve-category-display-name";

describe("resolveSubTaskCategoryDisplayName", () => {
  const options = [
    { id: "cat-1", name: "Corte de compensados" },
    { id: "cat-2", name: "Montagem" },
  ];

  it("prefers joined name when present", () => {
    expect(
      resolveSubTaskCategoryDisplayName("cat-1", options, "Corte de compensados"),
    ).toBe("Corte de compensados");
  });

  it("resolves name from category id when joined name is missing", () => {
    expect(resolveSubTaskCategoryDisplayName("cat-2", options, null)).toBe(
      "Montagem",
    );
  });

  it("returns no-category label when id and joined name are absent", () => {
    expect(resolveSubTaskCategoryDisplayName(null, options, null, "Sem categoria")).toBe(
      "Sem categoria",
    );
  });
});
